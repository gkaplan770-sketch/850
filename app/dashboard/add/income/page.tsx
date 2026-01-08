"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Users, Camera, 
  Calendar, ChevronDown, Smile, ListChecks
} from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ActivityType {
  id: string | number;
  name: string;
  category: string;
  tiers: any; 
  custom_fields: any;
}

const GEMATRIA_DAYS = [
  "", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", 
  "יא", "יב", "יג", "יד", "טו", "טז", "יז", "יח", "יט", "כ", 
  "כא", "כב", "כג", "כד", "כה", "כו", "כז", "כח", "כט", "ל"
];

export default function IncomeReportPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  
  // טופס
  const [selectedActId, setSelectedActId] = useState('');
  const [participants, setParticipants] = useState('');
  const [audience, setAudience] = useState<'boys' | 'girls'>('boys');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  
  const [calculatedReward, setCalculatedReward] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('user_id');
    if (!id) { router.push('/'); return; }
    setUserId(id);
    
    const fetchTypes = async () => {
        const { data } = await supabase.from('activity_types').select('*').order('name');
        if (data) {
            // המרה חכמה של הנתונים בטעינה
            const parsedData = data.map((item: any) => ({
                ...item,
                tiers: typeof item.tiers === 'string' ? JSON.parse(item.tiers) : (item.tiers || []),
                custom_fields: typeof item.custom_fields === 'string' ? JSON.parse(item.custom_fields) : (item.custom_fields || [])
            }));
            setActivityTypes(parsedData);
        }
    };
    fetchTypes();
  }, []);

  const getHebrewDate = (dateStr: string) => {
    try {
      if (!dateStr) return "";
      const d = new Date(dateStr + "T12:00:00");
      const dayNum = parseInt(d.toLocaleDateString('he-IL-u-ca-hebrew', { day: 'numeric' }).replace(/\D/g, ''), 10);
      const dayLetter = GEMATRIA_DAYS[dayNum] || dayNum;
      const month = d.toLocaleDateString('he-IL-u-ca-hebrew', { month: 'long' });
      const weekday = d.toLocaleDateString('he-IL', { weekday: 'long' });
      return `${dayLetter} ${month} ${weekday}`;
    } catch { return ""; }
  };

  // --- מנוע החישוב (ללא לוגים) ---
  useEffect(() => {
    const count = parseInt(participants, 10);
    // המרה ל-String כדי למנוע אי-התאמה בין מספר לטקסט ב-ID
    const act = activityTypes.find(a => String(a.id) === String(selectedActId));
    
    if (!act) {
        setCalculatedReward(0);
        return;
    }

    // וידוא שהמדרגות הן מערך
    let tiersArray: any[] = Array.isArray(act.tiers) ? act.tiers : [];
    
    if (isNaN(count) || count < 0) {
      setCalculatedReward(0);
      return;
    }

    const matched = tiersArray.find((t: any) => {
        const min = Number(t.min);
        const max = Number(t.max);
        return count >= min && count <= max;
    });

    if (matched) {
      const price = Number(matched.amount) || Number(matched.price) || 0;
      setCalculatedReward(price);
    } else {
      setCalculatedReward(0);
    }

  }, [participants, selectedActId, activityTypes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const handleCustomAnswerChange = (fieldId: string, value: any) => {
    setCustomAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActId || !imageFile) { alert("חובה לבחור פעילות ולהעלות תמונה"); return; }
    
    const act = activityTypes.find(a => String(a.id) === String(selectedActId));
    
    let fieldsArray: any[] = Array.isArray(act?.custom_fields) ? act.custom_fields : [];
    let valid = true;
    
    fieldsArray.forEach((f: any) => {
        if (f.required && (customAnswers[f.id] === undefined || customAnswers[f.id] === "")) {
            alert(`חסר מענה לשאלה: ${f.label}`);
            valid = false;
        }
    });
    if (!valid) return;

    setIsSubmitting(true);

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `act_${userId}_${Date.now()}.${fileExt}`;
      await supabase.storage.from('images').upload(fileName, imageFile);
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);

      const { error } = await supabase.from('transactions').insert([{
        user_id: userId,
        type: 'income',
        title: act?.name || 'פעילות',
        amount: calculatedReward,
        date: date,
        status: 'pending',
        file_url: urlData.publicUrl,
        details: {
          activity_id: selectedActId,
          participants: Number(participants),
          audience,
          notes: description,
          hebrew_date: getHebrewDate(date),
          custom_answers: customAnswers,
          custom_questions_snapshot: fieldsArray,
          calculated_by_system: true
        }
      }]);

      if (error) throw error;
      setShowSuccess(true);
    } catch (err: any) {
      alert("שגיאה בשליחה: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAct = activityTypes.find(a => String(a.id) === String(selectedActId));
  let displayFields = Array.isArray(currentAct?.custom_fields) ? currentAct.custom_fields : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20" dir="rtl">
      
      <div className="bg-white p-5 shadow-sm border-b sticky top-0 z-10 flex items-center gap-3">
         <Link href="/dashboard"><ArrowRight size={20} className="text-slate-600" /></Link>
         <h1 className="text-lg font-black text-slate-800">דיווח פעילות</h1>
      </div>

      <div className="p-5 max-w-xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
           
           <div className="bg-white p-5 rounded-3xl border shadow-sm space-y-4">
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">סוג הפעילות</label>
                 <div className="relative">
                    <select value={selectedActId} onChange={(e) => setSelectedActId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold appearance-none outline-none">
                       <option value="">בחר...</option>
                       {activityTypes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <ChevronDown className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20} />
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">תאריך</label>
                 <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
                 <div className="text-sm text-blue-600 font-bold mt-2 pr-2 bg-blue-50 p-2 rounded-lg inline-block">
                    {date ? getHebrewDate(date) : "בחר תאריך"}
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">כמות משתתפים</label>
                 <input type="number" value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="0" className="w-full p-4 pl-12 rounded-2xl border-2 outline-none focus:border-blue-500 font-black text-2xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button type="button" onClick={() => setAudience('boys')} className={`p-3 rounded-xl font-bold ${audience === 'boys' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>בנים</button>
                 <button type="button" onClick={() => setAudience('girls')} className={`p-3 rounded-xl font-bold ${audience === 'girls' ? 'bg-pink-600 text-white' : 'bg-slate-100'}`}>בנות</button>
              </div>

              <div className={`p-4 rounded-2xl text-center ${calculatedReward > 0 ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <div className="text-xs opacity-80">סכום לזיכוי</div>
                  <div className="text-3xl font-black">₪{calculatedReward}</div>
                  {calculatedReward === 0 && participants && Number(participants) > 0 && <div className="text-[10px] text-red-500 font-bold mt-1">לא נמצאה מדרגה מתאימה</div>}
              </div>
           </div>

           {displayFields.length > 0 && (
               <div className="bg-purple-50 p-5 rounded-3xl border border-purple-100 space-y-4">
                   {displayFields.map((field: any) => (
                       <div key={field.id}>
                           <label className="text-xs font-bold text-purple-700 block mb-1">{field.label}</label>
                           {field.type === 'boolean' ? (
                               <div className="flex gap-2">
                                   <button type="button" onClick={() => handleCustomAnswerChange(field.id, true)} className={`flex-1 p-2 rounded-lg font-bold ${customAnswers[field.id] === true ? 'bg-purple-600 text-white' : 'bg-white'}`}>כן</button>
                                   <button type="button" onClick={() => handleCustomAnswerChange(field.id, false)} className={`flex-1 p-2 rounded-lg font-bold ${customAnswers[field.id] === false ? 'bg-purple-600 text-white' : 'bg-white'}`}>לא</button>
                               </div>
                           ) : (
                               <input type={field.type === 'number' ? 'number' : 'text'} className="w-full p-3 rounded-xl border border-purple-200 outline-none bg-white" onChange={(e) => handleCustomAnswerChange(field.id, e.target.value)} />
                           )}
                       </div>
                   ))}
               </div>
           )}

           <div className="bg-white p-5 rounded-3xl border shadow-sm">
              <label className="text-xs font-bold text-slate-500 mb-1 block">תמונה (חובה)</label>
              <div className="relative border-2 border-dashed rounded-2xl p-6 text-center">
                  <input type="file" required accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0" />
                  <Camera className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-500">{imageFile ? 'נבחרה תמונה!' : 'לחץ לצילום'}</p>
              </div>
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 mt-4 rounded-2xl border outline-none resize-none" placeholder="הערות..." />
           </div>

           <button type="submit" disabled={isSubmitting || calculatedReward === 0} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 disabled:opacity-50">
              {isSubmitting ? "שולח..." : "שלח דיווח"}
           </button>
        </form>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
           <div className="bg-white w-full max-w-sm p-8 rounded-[2rem] text-center">
              <h2 className="text-2xl font-black mb-2">דיווח נקלט!</h2>
              <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl mt-4">למסך הראשי</button>
           </div>
        </div>
      )}
    </div>
  );
}