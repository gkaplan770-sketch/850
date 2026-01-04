"use client";

import React, { useState } from 'react';
import { ArrowRight, Receipt, UploadCloud, Calendar, Clock, CheckCircle, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function ReceiptsPage() {
  const router = useRouter();
  
  // נתוני דמה: רק עסקאות שסטטוסן "ממתין לקבלה" מופיעות כאן
  const [pendingItems, setPendingItems] = useState([
    { id: 1, title: "תשלום לחברת האוטובוסים", supplier: "אגד היסעים", amount: 1500, date: "24/12/2025" },
    { id: 2, title: "קניית פרסים למבצע", supplier: "הכל בשקל", amount: 320, date: "20/12/2025" },
    { id: 3, title: "כיבוד להתוועדות", supplier: "מאפיית הכפר", amount: 85, date: "18/12/2025" },
  ]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // פתיחת המודל להעלאה
  const handleOpenUpload = (item: any) => {
    setSelectedItem(item);
    setShowSuccess(false);
  };

  // סגירת המודל
  const handleClose = () => {
    setSelectedItem(null);
    setIsUploading(false);
  };

  // ביצוע ה"העלאה"
  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    // סימולציה של העלאה ועדכון שרת
    setTimeout(() => {
      setIsUploading(false);
      setShowSuccess(true);
      
      // הסרת הפריט מהרשימה אחרי שניה (כי הוא טופל)
      setTimeout(() => {
        setPendingItems(prev => prev.filter(i => i.id !== selectedItem.id));
        setSelectedItem(null);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans" dir="rtl">
      <div className="max-w-2xl mx-auto">
        
        {/* כפתור חזרה */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <ArrowRight size={20} />
          חזרה ללוח הבקרה
        </Link>

        {/* כותרת */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">השלמת קבלות</h1>
            <p className="text-slate-500 text-sm">יש להעלות קבלות עבור ההוצאות הבאות</p>
          </div>
          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
            {pendingItems.length} ממתינים
          </div>
        </div>

        {/* רשימת המשימות */}
        <div className="space-y-4">
          {pendingItems.length === 0 ? (
            // מצב ריק - הכל הושלם
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">הכל מעולה!</h3>
              <p className="text-slate-500">אין קבלות שצריך להשלים כרגע.</p>
              <Link href="/dashboard" className="mt-4 inline-block text-blue-600 font-bold text-sm hover:underline">
                חזור לדף הבית
              </Link>
            </div>
          ) : (
            // רשימת פריטים
            pendingItems.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-purple-200 transition-all">
                
                <div className="flex items-center gap-4">
                  <div className="bg-purple-50 text-purple-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{item.supplier}</h3>
                    <p className="text-sm text-slate-500">{item.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {item.date}
                      </span>
                      <span className="flex items-center gap-1 text-purple-600 font-medium bg-purple-50 px-1.5 rounded">
                        <AlertCircle size={10} /> חסרה קבלה
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="font-bold text-lg text-slate-900 mb-1">₪{item.amount}</div>
                  <button 
                    onClick={() => handleOpenUpload(item)}
                    className="bg-slate-900 hover:bg-purple-600 text-white text-xs px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-slate-200"
                  >
                    העלה קבלה
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

      </div>

      {/* מודל העלאה (Popup) */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            
            {!showSuccess ? (
              // טופס העלאה
              <form onSubmit={handleUpload} className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">העלאת קבלה</h2>
                    <p className="text-sm text-slate-500">{selectedItem.title}</p>
                  </div>
                  <button type="button" onClick={handleClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                    <X size={20} className="text-slate-500" />
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex justify-between items-center">
                   <div>
                      <p className="text-xs text-slate-400">ספק</p>
                      <p className="font-bold text-slate-800">{selectedItem.supplier}</p>
                   </div>
                   <div className="text-left">
                      <p className="text-xs text-slate-400">סכום</p>
                      <p className="font-bold text-slate-800">₪{selectedItem.amount}</p>
                   </div>
                </div>

                <div className="border-2 border-dashed border-purple-200 bg-purple-50/50 rounded-2xl p-8 text-center cursor-pointer hover:bg-purple-50 transition-colors mb-6 group">
                   <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-purple-600 group-hover:scale-110 transition-transform">
                      <UploadCloud size={24} />
                   </div>
                   <p className="font-bold text-purple-900">לחץ לבחירת קובץ</p>
                   <p className="text-xs text-purple-400 mt-1">תמונה או PDF עד 5MB</p>
                </div>

                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isUploading ? "מעלה קובץ..." : "שמור וסיים"}
                </button>
              </form>
            ) : (
              // מסך הצלחה
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                  <CheckCircle className="text-green-600 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">מעולה!</h2>
                <p className="text-slate-500">הקבלה נקלטה בהצלחה והמשימה הושלמה.</p>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}