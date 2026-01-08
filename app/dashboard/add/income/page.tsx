"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Users, Camera, 
  Calendar, ChevronDown, Smile, ListChecks 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'long-text';
  required: boolean;
}

interface ActivityType {
  id: string;
  name: string;
  category: string;
  tiers: { min: number; max: number; amount: number }[];
  custom_fields: CustomField[]; // הוספנו את זה
}

export default function IncomeReportPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  
  // נתונים מהשרת
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // טופס
  const [selectedActId, setSelectedActId] = useState('');
  const [participants, setParticipants] = useState('');
  const [audience, setAudience] = useState<'boys' | 'girls'>('boys'); // ברירת מחדל: בנים
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // תשובות לשאלות מותאמות אישית
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});

  // חישובים
  const [calculatedReward, setCalculatedReward] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('user_id');
    if (!id) { router.push('/'); return; }
    setUserId(id);
    fetchActivityTypes();
  }, []);

  // שליפת סוגי הפעילות מהמנהל כולל שדות מותאמים
  const fetchActivityTypes = async () => {
    const { data } = await supabase.from('activity_types').select('*').order('name');
    setActivityTypes(data || []);
    setLoadingTypes(false);
  };

  // --- המוח: חישוב אוטומטי של הסכום ---
  useEffect(() => {
    const count = Number(participants);
    const act = activityTypes.find(a => a.id === selectedActId);
    
    // איפוס תשובות כשמחליפים פעילות
    setCustomAnswers({});

    if (!act || count <= 0 || !act.tiers) {
      setCalculatedReward(0);
      return;
    }

    // חיפוש המדרגה המתאימה
    const tier = act.tiers.find(t => count >= t.min && count <= t.max);
    
    if (tier) {
      setCalculatedReward(tier.amount);
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
    
    // בדיקת שדות חובה מותאמים אישית
    const currentAct = activityTypes.find(a => a.id === selectedActId);
    if (currentAct?.custom_fields) {
        for (const field of currentAct.custom_fields) {
            if (field.required && !customAnswers[field.id]) {
                alert(`נא לענות על השאלה: ${field.label}`);
                return;
            }
        }
    }

    const total = Number(participants);
    setIsSubmitting(true);

    try {
      // 1. העלאת תמונה
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `act_${userId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);

      // 2. שמירת הדיווח
      const actName = currentAct?.name || 'פעילות';
      
      const { error: insertError } = await supabase.from('transactions').insert([{
        user_id: userId,
        type: 'income', // הכנסה
        title: actName,
        amount: calculatedReward, // הסכום שחושב אוטומטית
        date: date,
        status: 'pending', // ממתין לאישור מנהל
        file_url: urlData.publicUrl,
        details: {
          activity_id: selectedActId,
          participants: total,
          audience: audience, // כאן נשמר אם זה בנים או בנות
          notes: description,
          custom_answers: customAnswers, // שמירת התשובות לשאלות המיוחדות
          custom_questions_snapshot: currentAct?.custom_fields, // שמירת השאלות עצמן למקרה שישתנו בעתיד
          calculated_by_system: true
        }
      }]);

      if (insertError) throw insertError;
      
      setIsSubmitting(false);
      setShowSuccess(true);

    } catch (err) {
      console.error(err);
      alert("שגיאה בשליחת הדיווח");
      setIsSubmitting(false);
    }
  };

  const currentActivity = activityTypes.find(a => a.id === selectedActId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20" dir="rtl">
      
      {/* כותרת */}
      <div className="bg-white p-5 shadow-sm border-b border-slate-100 sticky top-0 z-10 flex items-center gap-3">
         <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600">
            <ArrowRight size={18} />
         </Link>
         <h1 className="text-lg font-black text-slate-800">דיווח על פעילות</h1>
      </div>

      <div className="p-5 max-w-xl mx-auto space-y-6">
        
        <form onSubmit={handleSubmit} className="space-y-6">
           
           {/* כרטיס ראשי: בחירת פעילות וכמות */}
           <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">איזה פעילות עשית?</label>
                 <div className="relative">
                    <select 
                      value={selectedActId}
                      onChange={(e) => setSelectedActId(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-800 appearance-none"
                    >
                       <option value="">בחר מהרשימה...</option>
                       {activityTypes.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                       ))}
                    </select>
                    <ChevronDown className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20} />
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">מתי זה קרה?</label>
                 <div className="relative">
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-800"
                    />
                    <Calendar className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20} />
                 </div>
              </div>

              <div className="pt-2">
                 <label className="text-xs font-bold text-slate-500 mb-1 block">כמה השתתפו סה"כ?</label>
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

              {/* כפתורי בחירה - בנים / בנות */}
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-2 block">מי היה הקהל?</label>
                 <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAudience('boys')}
                      className={`p-3 rounded-xl font-bold transition-all ${
                        audience === 'boys' 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                       בנים
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudience('girls')}
                      className={`p-3 rounded-xl font-bold transition-all ${
                        audience === 'girls' 
                          ? 'bg-pink-600 text-white shadow-lg shadow-pink-200' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                       בנות
                    </button>
                 </div>
              </div>

              {/* תצוגת הסכום המחושב */}
              <div className={`p-4 rounded-2xl text-center transition-all ${calculatedReward > 0 ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-100 text-slate-400'}`}>
                  <div className="text-xs font-medium opacity-80">סכום לזיכוי (לפי מחירון)</div>
                  <div className="text-3xl font-black mt-1">₪{calculatedReward}</div>
                  {calculatedReward === 0 && participants !== '' && Number(participants) > 0 && (
                      <div className="text-[10px] mt-1 text-red-100 font-bold">לא נמצאה מדרגת תשלום לכמות זו</div>
                  )}
              </div>
           </div>

           {/* אזור שאלות מותאמות אישית (דינאמי) */}
           {currentActivity?.custom_fields && currentActivity.custom_fields.length > 0 && (
               <div className="bg-purple-50 p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4 animate-in slide-in-from-bottom-2">
                   <h3 className="font-bold text-purple-900 flex items-center gap-2">
                       <ListChecks size={20}/> שאלות נוספות
                   </h3>
                   
                   {currentActivity.custom_fields.map((field) => (
                       <div key={field.id}>
                           <label className="text-xs font-bold text-purple-700 mb-1 block">
                               {field.label} {field.required && '*'}
                           </label>
                           
                           {/* סוג טקסט או טקסט ארוך */}
                           {(field.type === 'text' || field.type === 'long-text') && (
                               <input 
                                   type="text" 
                                   required={field.required}
                                   className="w-full p-3 rounded-xl border border-purple-200 outline-none focus:border-purple-500 bg-white"
                                   onChange={(e) => handleCustomAnswerChange(field.id, e.target.value)}
                               />
                           )}

                           {/* סוג מספר */}
                           {field.type === 'number' && (
                               <input 
                                   type="number" 
                                   required={field.required}
                                   className="w-full p-3 rounded-xl border border-purple-200 outline-none focus:border-purple-500 bg-white"
                                   onChange={(e) => handleCustomAnswerChange(field.id, e.target.value)}
                               />
                           )}

                           {/* סוג כן/לא */}
                           {field.type === 'boolean' && (
                               <div className="flex gap-2">
                                   <button type="button" onClick={() => handleCustomAnswerChange(field.id, true)} className={`flex-1 p-2 rounded-lg font-bold ${customAnswers[field.id] === true ? 'bg-purple-600 text-white' : 'bg-white text-purple-900 border border-purple-200'}`}>כן</button>
                                   <button type="button" onClick={() => handleCustomAnswerChange(field.id, false)} className={`flex-1 p-2 rounded-lg font-bold ${customAnswers[field.id] === false ? 'bg-purple-600 text-white' : 'bg-white text-purple-900 border border-purple-200'}`}>לא</button>
                               </div>
                           )}
                       </div>
                   ))}
               </div>
           )}

           {/* כרטיס תמונה והערות */}
           <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">תמונה מהפעילות (חובה)</label>
                 <div className="relative">
                    <input type="file" required accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${imageFile ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400'}`}>
                       <Camera className={`mx-auto mb-2 ${imageFile ? 'text-blue-600' : 'text-slate-300'}`} size={32} />
                       <p className={`text-sm font-bold ${imageFile ? 'text-blue-700' : 'text-slate-500'}`}>
                          {imageFile ? 'התמונה נבחרה!' : 'לחץ לצילום / העלאה'}
                       </p>
                    </div>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 mb-1 block">איך היה? (תיאור קצר)</label>
                 <textarea 
                   rows={3}
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 resize-none text-sm"
                   placeholder="היה מוצלח מאוד, הגיעו חבר'ה חדשים..."
                 />
              </div>
           </div>

           <button 
             type="submit" 
             disabled={isSubmitting || calculatedReward === 0} 
             className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
           >
              {isSubmitting ? "שולח..." : "שלח דיווח"}
           </button>
        </form>
      </div>

      {/* פופאפ הצלחה */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm p-8 rounded-[2rem] text-center shadow-2xl animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                 <Smile size={40} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">כל הכבוד!</h2>
              <p className="text-slate-500 mb-6">
                 הדיווח התקבל ויועבר לאישור המנהל.<br/>
                 סכום של <b>₪{calculatedReward}</b> יכנס ליתרה לאחר האישור.
              </p>
              <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl">חזור למסך הראשי</button>
           </div>
        </div>
      )}

    </div>
  );
}