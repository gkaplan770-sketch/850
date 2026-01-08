"use client";

import React, { useState } from 'react';
import { LogIn, AlertCircle, Loader2 } from "lucide-react"; 
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [idNumber, setIdNumber] = useState('');
  const [errorPopup, setErrorPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!idNumber) return;
    setLoading(true);

    try {
      // 1. בדיקה מול המסד (עם השם הנכון: teudat_zehut)
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('teudat_zehut', idNumber) // <--- הנה השינוי שביקשת
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      // 2. שמירת נתונים (גם ב-LocalStorage וגם ב-Cookie ליתר ביטחון)
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('user_branch', user.branch_name || 'סניף כללי');
      localStorage.setItem('user_name', user.full_name || 'שליח');
      
      // יצירת קוקי פשוט שעוזר למערכת להבין שיש משתמש (למשך שנה)
      // זה עוזר אם יש לך Middleware שחוסם את המעבר
      document.cookie = `user_id=${user.id}; path=/; max-age=31536000`;

      // 3. מעבר לדף הבית - שימוש בטעינה מלאה (Hard Navigation) כדי למנוע חזרה לדף הכניסה
      window.location.href = '/dashboard';

    } catch (err) {
      console.error("Login error:", err);
      setErrorPopup(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
      
      {/* כרטיס כניסה */}
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-black text-white mb-2">מערכת חב"ד לנוער</h1>
          <p className="text-slate-400 text-sm font-bold">פורטל דיווחים לשליח</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">
              הזדהות
            </label>
            <input 
              type="tel" 
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="הקלד תעודת זהות..." 
              className="w-full px-4 py-4 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-lg text-center tracking-widest font-black text-slate-900 transition-all placeholder:font-normal"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()} 
            />
          </div>

          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
            {loading ? "מתחבר..." : "כניסה למערכת"}
          </button>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold">© מערכת ניהול סניפים</p>
        </div>
      </div>

      {/* פופאפ שגיאה */}
      {errorPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95">
            <div className="bg-red-50 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-red-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">שגיאה</h3>
              <p className="text-slate-600 text-sm mb-6 font-medium">
                מספר הזהות לא נמצא במערכת.<br/>
                אנא וודא שהקלדת נכון או פנה למנהל.
              </p>
              <button 
                onClick={() => { setErrorPopup(false); setIdNumber(''); }}
                className="bg-slate-900 text-white w-full py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                נסה שוב
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}