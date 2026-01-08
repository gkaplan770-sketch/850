"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowLeft } from "lucide-react";
import { verifyLogin } from "./actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // ניקוי אישורים ישנים
  useEffect(() => {
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // אנחנו קוראים לשרת. אם זה מצליח - השרת יעביר אותנו דף אוטומטית.
    // אם חזרנו לפה, סימן שנכשלנו (כי ה-redirect זורק אותנו החוצה מהפונקציה בהצלחה)
    const result = await verifyLogin(inputCode);
    
    // אם הגענו לשורה הזאת, סימן שהייתה שגיאה
    if (result && !result.success) {
        setError(true);
        setInputCode(""); // איפוס הקוד
        setTimeout(() => setError(false), 2000);
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-800">
           <Lock size={32} />
        </div>
        
        <h1 className="text-2xl font-black text-slate-900 mb-2">כניסת מנהל</h1>
        <p className="text-slate-500 mb-6 text-sm">הכנס קוד גישה למערכת</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="tel" 
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className={`w-full text-center text-3xl font-black tracking-widest p-4 rounded-xl border-2 outline-none transition-all ${error ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 focus:border-slate-900'}`}
            placeholder="______"
            maxLength={6}
            autoFocus
            disabled={loading}
          />
          
          {error && <p className="text-red-500 font-bold text-sm">קוד שגוי!</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-70"
          >
            {loading ? "בודק..." : "כנס למערכת"}
          </button>
        </form>

        <button onClick={() => router.push('/')} className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-sm hover:text-slate-600">
           <ArrowLeft size={16} /> חזרה לאתר
        </button>
      </div>
    </div>
  );
}