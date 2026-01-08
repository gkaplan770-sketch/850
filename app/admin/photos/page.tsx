"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Loader2, Download, Filter, CheckCircle, Image as ImageIcon, RefreshCw } from "lucide-react";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<any[]>([]);
  
  const [branches, setBranches] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [zipping, setZipping] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    let res = photos;
    if (selectedMonth !== 'all') res = res.filter(p => p.monthYear === selectedMonth);
    if (selectedBranch !== 'all') res = res.filter(p => p.branchName === selectedBranch);
    setFilteredPhotos(res);
  }, [selectedMonth, selectedBranch, photos]);

  const fetchAllData = async () => {
    setLoading(true);
    
    // 1. משתמשים
    const { data: usersData } = await supabase.from('users').select('*');
    const allUsers = usersData || [];

    // 2. עסקאות (מחפשים את file_url במקום image_url)
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .not('file_url', 'is', null) // <--- התיקון: שימוש בשם העמודה האמיתי
      .order('created_at', { ascending: false });

    if (txError) {
      alert("שגיאה: " + txError.message);
      setLoading(false);
      return;
    }

    // 3. עיבוד הנתונים
    const processed = (txData || []).map((item: any) => {
      const user = allUsers.find(u => u.id === item.user_id);
      
      const branchName = user 
          ? (user.branch_name || user.full_name || user.email?.split('@')[0] || "ללא שם")
          : "לא ידוע";
      
      const dateObj = new Date(item.created_at);
      const monthYear = `${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
      
      // בדיקה אם נשמר תאריך עברי בפרטים, אם לא - מייצרים
      let hebrewDate = item.details?.hebrew_date;
      if (!hebrewDate) {
          hebrewDate = dateObj.toLocaleDateString('he-IL', { calendar: 'hebrew', day: 'numeric', month: 'long', year: 'numeric' });
      }

      // התיקון: שימוש ב-file_url
      // בגלל שבקוד השליח נשמר ה-URL המלא (publicUrl), אנחנו יכולים להשתמש בו ישירות!
      const finalUrl = item.file_url; 

      return {
        id: item.id,
        url: finalUrl,
        originalPath: item.file_url, // שומרים למקרה שנרצה למחוק
        createdAt: item.created_at,
        branchName,
        monthYear,
        hebrewDate
      };
    });

    setPhotos(processed);
    setFilteredPhotos(processed);

    const uniqueMonths = Array.from(new Set(processed.map((p: any) => p.monthYear)));
    const uniqueBranches = Array.from(new Set(processed.map((p: any) => p.branchName)));
    setMonths(uniqueMonths as string[]);
    setBranches(uniqueBranches as string[]);
    setLoading(false);
  };

  const downloadZip = async () => {
    if (filteredPhotos.length === 0) return;
    setZipping(true);

    const zip = new JSZip();
    const folder = zip.folder("photos_export");

    try {
      const promises = filteredPhotos.map(async (photo) => {
        try {
            const response = await fetch(photo.url);
            if (!response.ok) throw new Error('Fetch failed');
            const blob = await response.blob();
            
            const safeBranch = photo.branchName.replace(/[^א-תa-z0-9]/gi, '-'); 
            const safeDate = photo.hebrewDate.replace(/ /g, '-').replace(/['"]/g, '');
            const timeStr = new Date(photo.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
            
            const fileName = `${safeBranch}_${safeDate}_${timeStr}.jpg`;
            folder?.file(fileName, blob);
        } catch (err) { console.error("Skip", photo); }
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Photos_${selectedBranch === 'all' ? 'All' : selectedBranch}.zip`);
      
      setDownloadedIds([...downloadedIds, ...filteredPhotos.map(p => p.id)]);
    } catch (error) { alert("שגיאה בהורדה"); } 
    finally { setZipping(false); }
  };

  const handleDelete = async (photo: any) => {
    if (!confirm("למחוק?")) return;
    await supabase.from('transactions').delete().eq('id', photo.id);
    
    // מנסים למחוק גם את הקובץ אם הוא נשמר כנתיב (ולא כ-URL מלא)
    // אבל בגלל ששמרת URL מלא, המחיקה מהסטורג' עשויה להיכשל וזה בסדר, העיקר שנמחק מהגלריה.
    try {
        const path = photo.url.split('/storage/v1/object/public/images/')[1];
        if (path) await supabase.storage.from('images').remove([path]);
    } catch (e) {}

    const left = photos.filter(p => p.id !== photo.id);
    setPhotos(left);
    setFilteredPhotos(prev => prev.filter(p => p.id !== photo.id));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div><h1 className="text-3xl font-black text-slate-900">גלריית פעילות</h1></div>
        <div className="flex gap-3">
             <button onClick={fetchAllData} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-600"><RefreshCw size={20} /></button>
             <button onClick={downloadZip} disabled={zipping || filteredPhotos.length === 0} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg active:scale-95 disabled:opacity-50">
                {zipping ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                <span>{zipping ? 'מכווץ...' : `הורד (ZIP)`}</span>
             </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
         <div>
             <label className="text-xs font-bold text-slate-500 mb-2 block">סניף</label>
             <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none">
                <option value="all">הכל</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
         </div>
         <div>
             <label className="text-xs font-bold text-slate-500 mb-2 block">חודש</label>
             <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none">
                <option value="all">הכל</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
         </div>
         <div className="pb-3 text-left"><span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">נמצאו {filteredPhotos.length}</span></div>
      </div>

      {loading ? (
         <div className="text-center py-24 text-slate-400"><Loader2 className="animate-spin mx-auto mb-3 text-blue-600" size={32}/>טוען...</div>
      ) : filteredPhotos.length === 0 ? (
         <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200"><ImageIcon className="mx-auto text-slate-300 mb-2" size={48} /><p className="text-slate-500 font-bold">אין תמונות</p></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPhotos.map((img) => {
            const isDownloaded = downloadedIds.includes(img.id);
            return (
                <div key={img.id} className={`group relative bg-white p-2 rounded-2xl shadow-sm border transition-all ${isDownloaded ? 'border-green-200 bg-green-50' : 'border-slate-100 hover:shadow-md'}`}>
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative cursor-pointer">
                        <img src={img.url} className={`w-full h-full object-cover ${isDownloaded ? 'grayscale opacity-60' : ''}`} loading="lazy" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 flex flex-col justify-end">
                            <p className="text-white text-xs font-bold truncate text-center">{img.branchName}</p>
                            <p className="text-white/70 text-[10px] text-center">{img.hebrewDate}</p>
                        </div>
                        {isDownloaded && <div className="absolute inset-0 flex items-center justify-center bg-black/5"><div className="bg-green-500 text-white p-2 rounded-full shadow-lg"><CheckCircle size={24} /></div></div>}
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(img); }} className="absolute top-2 right-2 bg-white/90 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 shadow-sm"><Trash2 size={16} /></button>
                    </div>
                </div>
            )
          })}
        </div>
      )}
    </div>
  );
}