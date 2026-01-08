"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Users, Camera, 
  Calendar, ChevronDown, Smile, Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// הגדרת המבנה של פעילות
interface ActivityType {
  id: string | number;
  name: string;
  category: string;
  image_required: boolean;
  tiers: any[];
}

export default function IncomeReportPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  
  const [selectedActId, setSelectedActId] = useState('');
  const [participants, setParticipants] = useState('');
  const [audience, setAudience] = useState<'boys' | 'girls'>('boys'); 
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [hebrewDateStr, setHebrewDateStr] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [calculatedReward, setCalculatedReward] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentAct = activityTypes.find(a => String(a.id) === String(selectedActId));
  const isImageRequired = currentAct?.image_required !== false; 

  useEffect(() => {
    const id = localStorage.getItem('user_id');
    if (!id) { router.push('/'); return; }
    setUserId(id);
    fetchActivityTypes();
    updateHebrewDate(new Date().toISOString().split('T')[0]); 
  }, []);

  const fetchActivityTypes = async () => {
    const { data } = await supabase.from('activity_types').select('*').order('name');
    setActivityTypes(data || []);
  };

  // --- פונקציה חדשה: תאריך עברי עם אותיות ויום בשבוע ---
  const updateHebrewDate = (dateVal: string) => {
    try {
      const d = new Date(dateVal);
      
      // 1. קבלת היום בשבוע (למשל: "יום שלישי")
      const dayOfWeek = d.toLocaleDateString('he-IL', { weekday: 'long' });

      // 2. קבלת שם החודש העברי (למשל: "תשרי")
      const monthName = d.toLocaleDateString('he-IL', { calendar: 'hebrew', month: 'long' });

      // 3. קבלת המספר של היום העברי
      // אנו משתמשים בטריק כדי לחלץ את המספר שהדפדפן נותן ללוח העברי
      const dayNumStr = d.toLocaleDateString('he-IL-u-ca-hebrew', { day: 'numeric' });
      const dayNum = parseInt(dayNumStr.replace(/\D/g, ''), 10); // מנקים הכל חוץ ממספרים

      // 4. המרה לגימטריה (אותיות)
      const toGematria = (num: number) => {
          const letters = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
          if (num <= 9) return letters[num];
          if (num === 10) return "י";
          if (num === 15) return "טו"; // ט"ו
          if (num === 16) return "טז"; // ט"ז
          if (num > 10 && num < 20) return "י" + letters[num % 10];
          if (num === 20) return "כ";
          if (num > 20 && num < 30) return "כ" + letters[num % 10];
          if (num === 30) return "ל";
          return num.toString(); // גיבוי
      };

      const dayLetters = toGematria(dayNum);

      // הרכבת המחרוזת הסופית: יום שני כד אדר א
      setHebrewDateStr(`${dayOfWeek} ${dayLetters} ${monthName}`);

    } catch (e) {
      setHebrewDateStr('');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    updateHebrewDate(newDate);
  };

  // חישוב סכום
  useEffect(() => {
    const count = Number(participants);
    
    if (!currentAct || count <= 0 || !currentAct.tiers || !Array.isArray(currentAct.tiers)) {
      setCalculatedReward(0);
      return;
    }

    const tier = currentAct.tiers.find(t => {
       const min = Number(t.min);
       const max = Number(t.max);
       return count >= min && count <= max;
    });
    
    if (tier) {
      setCalculatedReward(Number(tier.amount));
    } else {
      setCalculatedReward(0);
    }

  }, [participants, selectedActId, activityTypes, currentAct]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedActId) { alert("חובה לבחור סוג פעילות"); return; }
    if (isImageRequired && !imageFile) { alert("חובה להעלות תמונה"); return; }
    
    const total = Number(participants);
    setIsSubmitting(true);

    try {
      let publicUrl = null;

      if (imageFile) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `act_${userId}_${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          publicUrl = urlData.publicUrl;
      }

      const actName = currentAct?.name || 'פעילות';
      
      const { error: insertError } = await supabase.from('transactions').insert([{
        user_id: userId,
        type: 'income',
        title: actName,
        amount: calculatedReward,
        date: date,
        status: 'pending',
        file_url: publicUrl,
        details: {
          activity_id: selectedActId,
          participants: total,
          audience: audience, 
          notes: description,
          calculated_by_system: true,
          hebrew_date: hebrewDateStr // שומרים את הפורמט היפה גם בבסיס הנתונים
        }
      }]);

      if (insertError) throw insertError;
      
      setIsSubmitting(false);
      setShowSuccess(true);

    } catch (err) {
      console.error(err);
      alert("שגיאה בשליחה: אנא נסה שוב");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20" dir="rtl">
      
      <div className="bg-white p-5 shadow-sm border-b border-slate-100 sticky top-0 z-10 flex items-center gap-3">
         <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600">
            <ArrowRight size={18} />
         </Link>
         <h1 className="text-lg font-black text-slate-800">דיווח פעילות</h1>
      </div>

      <div className="p-5 max-w-xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
           
           <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              
              {/* בחירת פעילות */}
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">איזה פעילות עשית?</label>
                 <div className="relative">
                    <select 
                      value={selectedActId}
                      onChange={(e) => setSelectedActId(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-800 appearance-none bg-white"
                    >
                       <option value="">בחר מהרשימה...</option>
                       {activityTypes.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                       ))}
                    </select>
                    <ChevronDown className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20} />
                 </div>
              </div>

              {/* תאריך */}
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">מתי זה קרה?</label>
                 <div className="relative">
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={handleDateChange}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-800"
                    />
                    <Calendar className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20} />
                 </div>
                 {/* תצוגה מעודכנת של תאריך עברי */}
                 <div className="text-center text-blue-600 text-sm font-bold mt-2">
                    {hebrewDateStr}
                 </div>
              </div>

              {/* משתתפים */}
              <div className="pt-2">
                 <label className="text-xs font-bold text-slate-500 mb-1 block">כמה משתתפים היו?</label>
                 <div className="relative">
                    <input 
                      type="number" 
                      required
                      placeholder="0"
                      value={participants}
                      onChange={(e) => setParticipants(e.target.value)}
                      className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 font-black text-2xl"
                    />
                    <Users className="absolute left-4 top-5 text-slate-300 pointer-events-none" size={24} />
                 </div>
              </div>

              {/* קהל */}
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-2 block">מי היה הקהל?</label>
                 <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setAudience('boys')} className={`p-3 rounded-xl font-bold transition-all ${audience === 'boys' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>בנים</button>
                    <button type="button" onClick={() => setAudience('girls')} className={`p-3 rounded-xl font-bold transition-all ${audience === 'girls' ? 'bg-pink-600 text-white shadow-lg shadow-pink-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>בנות</button>
                 </div>
              </div>

              {/* סכום */}
              <div className={`p-4 rounded-2xl text-center transition-all ${calculatedReward > 0 ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-100 text-slate-400'}`}>
                  <div className="text-xs font-medium opacity-80">סכום לזיכוי (לפי מחירון)</div>
                  <div className="text-3xl font-black mt-1">₪{calculatedReward}</div>
                  
                  {calculatedReward === 0 && Number(participants) > 0 && (
                      <div className="text-[10px] mt-1 text-red-100 font-bold bg-red-500/20 px-2 rounded inline-block">
                          לא הוגדרה מדרגת תשלום לכמות זו ({participants})
                      </div>
                  )}
              </div>
           </div>

           {/* תמונה */}
           <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div>
                 <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500 block">תמונה מהפעילות</label>
                    <span className={`text-[10px] px-2 rounded-full ${isImageRequired ? 'bg-red-100 text-red-600 font-bold' : 'bg-green-100 text-green-600'}`}>
                        {isImageRequired ? 'חובה' : 'רשות'}
                    </span>
                 </div>
                 
                 {previewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200">
                       <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                       <button onClick={removeImage} type="button" className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors">
                          <Trash2 size={18} />
                       </button>
                    </div>
                 ) : (
                    <div className="relative">
                       <input type="file" required={isImageRequired} accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                       <div className="border-2 border-dashed rounded-2xl p-6 text-center border-slate-200 hover:border-blue-400 transition-colors">
                          <Camera className="mx-auto mb-2 text-slate-300" size={32} />
                          <p className="text-sm font-bold text-slate-500">לחץ להעלאת תמונה</p>
                       </div>
                    </div>
                 )}
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">איך היה? (תיאור קצר)</label>
                 <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 resize-none text-sm" placeholder="כתוב כאן..." />
              </div>
           </div>

           <button 
             type="submit" 
             disabled={isSubmitting || (Number(participants) > 0 && calculatedReward === 0)} 
             className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
           >
              {isSubmitting ? "שולח..." : "שלח דיווח"}
           </button>
        </form>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm p-8 rounded-[2rem] text-center shadow-2xl animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><Smile size={40} strokeWidth={3} /></div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">כל הכבוד!</h2>
              <p className="text-slate-500 mb-6">הדיווח התקבל! סכום של <b>₪{calculatedReward}</b> יכנס ליתרה לאחר האישור.</p>
              <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl">חזור למסך הראשי</button>
           </div>
        </div>
      )}
    </div>
  );
}