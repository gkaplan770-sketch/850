"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === '226770226') {
      router.push('/admin/dashboard');
    } else {
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
                onChange={(e) => setCode(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-center text-xl tracking-[0.5em] font-bold"
                placeholder="••••••••"
                autoFocus
              />
              <Lock className="absolute right-4 top-3.5 text-slate-400" size={18} />
            </div>
            {error && <p className="text-red-500 text-xs mt-2 font-bold text-center">קוד שגוי. נסה שנית.</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
          >
            כנס למערכת הניהול
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