"use client";

import React, { useState, useEffect } from 'react';
import { 
  Check, X, Users, DollarSign, Eye, Calendar
} from "lucide-react";

// --- התיקון נמצא בשורה הזו ---
// במקום @/lib/supabase השתמשנו בנתיב מלא
import { supabase } from '../../../lib/supabase';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'branch' | 'date'>('date');
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // טעינת נתונים אמיתיים מ-Supabase
  const fetchRequests = async () => {
    setLoading(true);
    try {
      // שליפת עסקאות בסטטוס 'pending' + פרטי המשתמש המקושר
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          users:user_id (
            first_name,
            last_name,
            branch_name
          )
        `)
        .eq('status', 'pending');

      if (error) throw error;

      // המרת הנתונים לפורמט נוח לשימוש
      const formattedData = data.map((item: any) => ({
        id: item.id,
        type: item.type === 'supplier' ? 'expense' : item.type, // איחוד סוגי הוצאות
        branch: item.users?.branch_name || 'לא ידוע',
        shaliach: `${item.users?.first_name} ${item.users?.last_name}`,
        title: item.title,
        amount: item.amount,
        date: item.date,
        file_url: item.file_url,
        details: item.details || {},
        created_at: item.created_at
      }));

      setRequests(formattedData);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // --- לוגיקה ---

  // סינון ומיון
  const filteredRequests = requests
    .filter(req => filterType === 'all' || req.type === filterType)
    .sort((a, b) => {
      if (sortBy === 'branch') return a.branch.localeCompare(b.branch);
      // ברירת מחדל: מהחדש לישן
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // חישוב סכום לאישור (עבור הכנסות שעדיין אין להן סכום סופי)
  const calculateSuggestedAmount = (participants: number) => {
    if (!participants) return 0;
    if (participants < 20) return 200;
    if (participants < 50) return 500;
    return 1000;
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      let finalAmount = selectedRequest.amount;
      
      if (selectedRequest.type === 'income') {
         finalAmount = calculateSuggestedAmount(selectedRequest.details.participants);
      }

      // עדכון ב-Supabase
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'approved',
          amount: finalAmount 
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      alert("הבקשה אושרה בהצלחה!");
      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      closeModal();

    } catch (err) {
      console.error("Error approving:", err);
      alert("שגיאה באישור הבקשה");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      alert("חובה לכתוב סיבת דחייה");
      return;
    }

    try {
      const updatedDetails = {
        ...selectedRequest.details,
        rejection_reason: rejectionReason
      };

      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'rejected',
          details: updatedDetails
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      alert("הבקשה נדחתה.");
      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      closeModal();

    } catch (err) {
      console.error("Error rejecting:", err);
      alert("שגיאה בדחיית הבקשה");
    }
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setIsRejecting(false);
    setRejectionReason("");
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* כותרת ופילטרים */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">לוח בקרה - ממתינים לאישור</h2>
          <p className="text-slate-500 mt-1">ישנן {requests.length} בקשות שמחכות לטיפולך</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex gap-1 pl-4 border-l border-slate-200 ml-4">
            <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>הכל</button>
            <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'income' ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}>פעילויות</button>
            <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'expense' ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}>תשלומים</button>
          </div>

          <div className="flex items-center gap-2 px-3">
            <span className="text-xs font-bold text-slate-400">מיין לפי:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'branch' | 'date')}
              className="bg-slate-50 border-none text-sm font-bold text-slate-700 rounded-lg py-1 pr-8 outline-none cursor-pointer"
            >
              <option value="date">זמן שליחה</option>
              <option value="branch">סניף (א-ב)</option>
            </select>
          </div>
        </div>
      </div>

      {/* טעינה */}
      {loading && (
        <div className="text-center py-20">
          <p className="text-slate-400 font-bold animate-pulse">טוען נתונים...</p>
        </div>
      )}

      {/* גריד בקשות */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRequests.map((req) => (
            <div 
              key={req.id} 
              onClick={() => setSelectedRequest(req)}
              className={`cursor-pointer group relative bg-white rounded-2xl shadow-sm border-2 transition-all hover:-translate-y-1 hover:shadow-xl ${
                req.type === 'income' 
                  ? 'border-green-100 hover:border-green-400' 
                  : 'border-red-100 hover:border-red-400'
              }`}
            >
              <div className={`h-2 w-full rounded-t-xl ${req.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    req.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {req.type === 'income' ? 'עדכון פעילות' : 'בקשת תשלום'}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{req.date}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-1">{req.branch}</h3>
                <p className="text-sm text-slate-500 mb-4">{req.shaliach}</p>
                
                <div className="bg-slate-50 p-3 rounded-xl mb-4">
                  <p className="font-medium text-slate-800 text-sm line-clamp-1">{req.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {req.type === 'income' ? (
                      <>
                          <Users size={14} className="text-slate-400"/>
                          <span className="text-sm font-bold">{req.details.participants} משתתפים</span>
                      </>
                    ) : (
                      <>
                          <DollarSign size={14} className="text-slate-400"/>
                          <span className="text-sm font-bold text-red-600">₪{req.amount}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-blue-600 text-sm font-bold group-hover:underline">
                  <Eye size={16} />
                  לחץ לצפייה ואישור
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredRequests.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={40} className="text-slate-400" />
           </div>
           <h3 className="text-xl font-bold text-slate-600">הכל נקי!</h3>
           <p className="text-slate-400">אין בקשות ממתינות התואמות את הסינון.</p>
        </div>
      )}


      {/* --- מודל (Popup) לפרטי בקשה --- */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95">
            
            {/* צד ימין - תמונה/מסמך */}
            <div className="w-full md:w-1/2 bg-slate-100 p-8 flex items-center justify-center border-l border-slate-200">
               {selectedRequest.file_url ? (
                  <div className="text-center w-full h-full">
                      <img 
                       src={selectedRequest.file_url} 
                       alt="אסמכתא" 
                       className="max-h-[60vh] object-contain rounded-lg shadow-md mx-auto"
                      />
                      <a href={selectedRequest.file_url} target="_blank" className="text-blue-600 text-sm font-bold mt-4 block hover:underline">
                         פתח תמונה בחלון חדש
                      </a>
                  </div>
               ) : (
                  <div className="text-center text-slate-400">
                      <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                         <X size={30} />
                      </div>
                      <p>לא צורף קובץ</p>
                  </div>
               )}
            </div>

            {/* צד שמאל - פרטים ופעולות */}
            <div className="w-full md:w-1/2 p-8 flex flex-col">
               <div className="flex justify-between items-start mb-6">
                  <div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                         selectedRequest.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                         {selectedRequest.type === 'income' ? 'עדכון פעילות' : 'בקשת תשלום'}
                      </span>
                      <h2 className="text-2xl font-bold text-slate-900 mt-2">{selectedRequest.branch}</h2>
                      <p className="text-slate-500">{selectedRequest.shaliach} • {selectedRequest.date}</p>
                  </div>
                  <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
               </div>

               <div className="flex-1 space-y-6 overflow-y-auto">
                  {/* פרטי הפעילות */}
                  <div className="bg-slate-50 p-5 rounded-2xl space-y-3">
                      <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2">פרטי הדיווח</h4>
                      <p><span className="text-slate-500 text-sm ml-2">נושא:</span><span className="font-bold">{selectedRequest.title}</span></p>
                      
                      {selectedRequest.type === 'income' ? (
                        <>
                          <p><span className="text-slate-500 text-sm ml-2">כמות משתתפים:</span><span className="font-bold">{selectedRequest.details.participants}</span></p>
                          <p><span className="text-slate-500 text-sm ml-2">יום:</span><span className="font-bold">{selectedRequest.details.day}</span></p>
                          <p><span className="text-slate-500 text-sm ml-2">קהל יעד:</span><span className="font-bold">{selectedRequest.details.audience === 'boys' ? 'בנים' : 'בנות'}</span></p>
                          
                          <div className="mt-4 bg-green-50 p-3 rounded-xl border border-green-100">
                             <p className="text-green-800 text-sm">המערכת חישבה זיכוי של:</p>
                             <p className="text-2xl font-black text-green-600">₪{calculateSuggestedAmount(selectedRequest.details.participants)}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <p><span className="text-slate-500 text-sm ml-2">הערות:</span><span className="font-bold">{selectedRequest.details.notes || '-'}</span></p>
                          
                          {selectedRequest.details.bank_details && (
                            <div className="text-xs bg-white p-2 rounded border border-slate-200 mt-2">
                              <p className="font-bold text-slate-700 mb-1">פרטי בנק:</p>
                              <p>ע"ש: {selectedRequest.details.bank_details.ownerName}</p>
                              <p>בנק: {selectedRequest.details.bank_details.bankNumber} | סניף: {selectedRequest.details.bank_details.branchNumber}</p>
                              <p>חשבון: {selectedRequest.details.bank_details.accountNumber}</p>
                            </div>
                          )}

                          <div className="mt-4 bg-red-50 p-3 rounded-xl border border-red-100">
                             <p className="text-red-800 text-sm">סכום לתשלום:</p>
                             <p className="text-2xl font-black text-red-600">₪{selectedRequest.amount}</p>
                          </div>
                        </>
                      )}
                  </div>

                  {/* אזור דחייה (אם נלחץ) */}
                  {isRejecting && (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 animate-in slide-in-from-top-2">
                        <label className="text-sm font-bold text-red-800 mb-2 block">מדוע הבקשה נדחית? (חובה)</label>
                        <textarea 
                           className="w-full p-3 rounded-xl border-red-200 focus:ring-red-500 focus:border-red-500 text-sm"
                           rows={3}
                           placeholder="כתוב כאן הודעה שתשלח לשליח..."
                           value={rejectionReason}
                           onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                  )}
               </div>

               {/* כפתורים תחתונים */}
               <div className="mt-8 grid grid-cols-2 gap-4">
                  {!isRejecting ? (
                    <>
                        <button 
                          onClick={() => setIsRejecting(true)}
                          className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                        >
                           <X size={20} />
                           דחה בקשה
                        </button>
                        <button 
                          onClick={handleApprove}
                          className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-green-600 shadow-lg shadow-slate-900/20 transition-all"
                        >
                           <Check size={20} />
                           אשר בקשה
                        </button>
                    </>
                  ) : (
                    <>
                        <button 
                          onClick={() => setIsRejecting(false)}
                          className="py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                        >
                           ביטול
                        </button>
                        <button 
                          onClick={handleReject}
                          className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all"
                        >
                           שלח דחייה
                        </button>
                    </>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}