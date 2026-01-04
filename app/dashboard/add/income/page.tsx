"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Users, Camera, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ActivityReportPage() {
  const router = useRouter();
  const [branchName, setBranchName] = useState('טוען...');
  const [userId, setUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // נתונים לטופס
  const [formData, setFormData] = useState({
    targetAudience: 'boys',
    participantsCount: '',
    activityDate: new Date().toISOString().split('T')[0],
    activityDay: '',
    activityType: '',
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'מוצ"ש'];
  const activityTypes = [
    { id: 'lesson', name: 'שיעור שבועי' },
    { id: 'event', name: 'פעילות שיא / מסיבה' },
    { id: 'trip', name: 'טיול' },
    { id: 'farbrengen', name: 'התוועדות' },
  ];

  useEffect(() => {
    // שליפת פרטי משתמש מהזיכרון
    const storedBranch = localStorage.getItem('user_branch') || 'סניף לא ידוע';
    const storedUserId = localStorage.getItem('user_id');
    
    if (!storedUserId) {
      router.push('/'); // אם אין משתמש מחובר, זרוק אותו החוצה
      return;
    }

    setBranchName(storedBranch);
    setUserId(storedUserId);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // 1. העלאת תמונה (אם נבחרה)
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`; // שם ייחודי לקובץ
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        // קבלת הקישור הציבורי לתמונה
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrlData.publicUrl;
      }

      // 2. שמירת הנתונים בטבלה
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: userId,
            type: 'income',
            title: `${getActivityName(formData.activityType)} - ${formData.activityDay}`,
            amount: 0, // הסכום יחושב ע"י המנהל בעת האישור
            date: formData.activityDate,
            status: 'pending',
            file_url: imageUrl,
            // שמירת כל הפרטים הנוספים בתוך עמודת JSON
            details: {
              audience: formData.targetAudience,
              participants: Number(formData.participantsCount),
              activity_type: formData.activityType,
              day: formData.activityDay
            }
          }
        ]);

      if (insertError) throw insertError;

      // סיום בהצלחה
      setIsSubmitting(false);
      setShowSuccessPopup(true);

    } catch (error) {
      console.error('Error submitting report:', error);
      alert('אירעה שגיאה בשליחת הדיווח. נסה שנית.');
      setIsSubmitting(false);
    }
  };

  // פונקציית עזר להמרת קוד פעילות לשם בעברית
  const getActivityName = (id: string) => {
    const activity = activityTypes.find(a => a.id === id);
    return activity ? activity.name : id;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans" dir="rtl">
      <div className="max-w-xl mx-auto pb-20">
        
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 font-medium hover:text-blue-600 mb-6 transition-colors px-2">
          <ArrowRight size={20} />
          חזרה
        </Link>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          
          <div className="p-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-xl"></div>
            <h1 className="text-2xl font-bold relative z-10">עדכון פעילות</h1>
            <p className="text-blue-100 text-sm mt-1 relative z-10">{branchName}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* בנים / בנות */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 px-1">קהל יעד</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, targetAudience: 'boys'})}
                  className={`py-5 rounded-2xl font-bold text-lg transition-all shadow-sm border ${
                    formData.targetAudience === 'boys' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-transparent shadow-blue-500/30 ring-2 ring-offset-2 ring-blue-500' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  בנים
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, targetAudience: 'girls'})}
                  className={`py-5 rounded-2xl font-bold text-lg transition-all shadow-sm border ${
                    formData.targetAudience === 'girls' 
                      ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white border-transparent shadow-pink-500/30 ring-2 ring-offset-2 ring-pink-500' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  בנות
                </button>
              </div>
            </div>

            {/* כמות משתתפים */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 px-1">כמות משתתפים</label>
              <div className="relative">
                <input 
                  type="number" 
                  required
                  min="1"
                  value={formData.participantsCount}
                  onChange={(e) => setFormData({...formData, participantsCount: e.target.value})}
                  className="block w-full px-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xl text-center shadow-inner"
                  placeholder="0"
                />
              </div>
            </div>

            {/* תאריך ויום */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">תאריך</label>
                <input 
                  type="date" 
                  required
                  value={formData.activityDate}
                  onChange={(e) => setFormData({...formData, activityDate: e.target.value})}
                  className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">יום</label>
                <select 
                  required
                  value={formData.activityDay}
                  onChange={(e) => setFormData({...formData, activityDay: e.target.value})}
                  className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium"
                >
                  <option value="">בחר...</option>
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* סוג הפעילות */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 px-1">סוג הפעילות</label>
              <select 
                required
                value={formData.activityType}
                onChange={(e) => setFormData({...formData, activityType: e.target.value})}
                className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium text-lg"
              >
                <option value="">בחר סוג פעילות...</option>
                {activityTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* העלאת תמונה */}
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-2 px-1">תמונה (רשות)</label>
               <div className="relative">
                  <input 
                     type="file" 
                     accept="image/*"
                     onChange={handleImageChange}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all bg-white/50 ${selectedImage ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                     {selectedImage ? (
                        <div className="text-green-600 flex flex-col items-center">
                           <Check size={32} />
                           <span className="font-bold mt-2">{selectedImage.name}</span>
                           <span className="text-xs">לחץ להחלפה</span>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center text-slate-500">
                           <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-2 text-blue-600">
                              <Camera size={24} />
                           </div>
                           <span className="text-sm font-medium">לחץ לצילום או בחירת תמונה</span>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-lg mt-4"
            >
              {isSubmitting ? "שולח נתונים..." : "שמור ושלח דיווח"}
            </button>

          </form>
        </div>
      </div>

      {/* פופאפ הצלחה */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">הדיווח נשלח!</h2>
            <p className="text-slate-500 mb-8">הפרטים נקלטו ויועברו לבדיקת המנהל.</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg"
            >
              חזור לדף הבית
            </button>
          </div>
        </div>
      )}
    </div>
  );
}