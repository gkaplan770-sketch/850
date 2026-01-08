"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // תיקון: שיניתי את ברירת המחדל ל-226770 כדי שתתאים לצילום המסך שלך
  // המערכת תנסה למשוך מ-Vercel, ואם לא תצליח - תשתמש בסיסמה הזו
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '226770';

  // מנקה כל התחברות קודמת בעת טעינת הדף
  useEffect(() => {
    document.cookie = "admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // כלי עזר לבדיקה: זה ידפיס לקונסול בדפדפן מה הסיסמה שהמערכת מצפה לה
    // (תוכל לראות את זה אם תלחץ F12 ואז Console בדפדפן)
    console.log('User typed:', code);
    console.log('System expects:', ADMIN_PASSWORD);

    // --- בדיקת האבטחה ---
    // משווה את מה שהקלדת (code) לסיסמה שמוגדרת (ADMIN_PASSWORD)
    if (code === ADMIN_PASSWORD) {
      // 1. סיסמה נכונה
      document.cookie = "admin-auth=true; path=/; max-age=86400"; 
      router.push('/admin/dashboard');
    } else {
      // 2. סיסמה שגויה
      setLoading(false);
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="bg-blue-900 p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
           <ShieldCheck className="mx-auto text-blue-400 mb-4 w-12 h-12" />
           <h1 className="text-2xl font-bold text-white">כניסת מנהל מערכת</h1>
           <p className="text-blue-200 text-sm mt-1">גישה למורשים בלבד</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">קוד גישה</label>
            <div className="relative">
              <input 
                type="password" 
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                className={`block w-full px-4 py-3 bg-slate-50 border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-center text-xl tracking-[0.5em] font-bold transition-all`}
                placeholder="••••••"
                autoFocus
                autoComplete="off"
              />
              <Lock className="absolute right-4 top-3.5 text-slate-400" size={18} />
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 text-xs mt-3 py-2 px-3 rounded-lg font-bold text-center animate-pulse border border-red-100">
                קוד שגוי - נסה שוב (הקוד הוא 226770)
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            {loading ? "בודק הרשאה..." : "כנס למערכת הניהול"}
          </button>

          <div className="text-center pt-2">
            <Link href="/" className="text-slate-400 hover:text-slate-600 text-sm inline-flex items-center gap-1 transition-colors">
              <ArrowLeft size={14} />
              חזרה למסך הכניסה הראשי
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}