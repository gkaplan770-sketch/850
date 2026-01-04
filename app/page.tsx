"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, AlertCircle } from "lucide-react";
import { supabase } from '@/lib/supabase'; // וודא שקובץ זה קיים בתיקיית lib

export default function LoginPage() {
  const router = useRouter();
  const [idNumber, setIdNumber] = useState('');
  const [errorPopup, setErrorPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!idNumber) return;
    setLoading(true);

    try {
      // 1. שאילתה למסד הנתונים: חפש משתמש עם ת.ז זו
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('teudat_zehut', idNumber)
        .single();

      if (error || !user) {
        // אם יש שגיאה או לא נמצא משתמש
        throw new Error('User not found');
      }

      // 2. אם נמצא - שמור את הפרטים בזיכרון המקומי (לשימוש בדפים אחרים)
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('user_branch', user.branch_name || 'סניף כללי');
      localStorage.setItem('user_name', `${user.first_name} ${user.last_name}`);
      localStorage.setItem('user_role', user.role || 'shaliach');

      // 3. מעבר לדף הבית
      router.push('/dashboard');

    } catch (err) {
      console.error("Login error:", err);
      setErrorPopup(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
      
      {/* כרטיס כניסה */}
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">מערכת חב"ד לנוער</h1>
          <p className="text-blue-100 text-sm">פורטל ניהול סניפים</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">
              מספר תעודת זהות
            </label>
            <input 
              type="tel" 
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="הכנס ת.ז" 
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg text-center tracking-widest font-bold text-slate-800"
            />
          </div>

          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? "בודק נתונים..." : (
              <>
                <LogIn size={20} />
                כנס למערכת
              </>
            )}
          </button>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400">© כל הזכויות שמורות</p>
        </div>
      </div>

      {/* פופאפ שגיאה */}
      {errorPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-red-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">שגיאת התחברות</h3>
              <p className="text-slate-600 mb-6">
                מצטערים, תעודת הזהות שהזנת אינה קיימת במערכת.
                <br/>
                נא לפנות לאחראי להסדרת הרישום.
              </p>
              <button 
                onClick={() => { setErrorPopup(false); setIdNumber(''); }}
                className="bg-red-600 text-white w-full py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                נסה שנית
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}