"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, Phone, MapPin, Hash, LogOut, 
  CreditCard, Shield, ArrowRight, Heart 
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) { router.push('/'); return; }

      // שליפת פרטי המשתמש + שם המנוי (אם יש)
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          subscription_types (name, monthly_cost)
        `)
        .eq('id', userId)
        .single();

      if (!error) setUser(data);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    if (confirm("האם לצאת מהמערכת?")) {
      localStorage.clear();
      router.push('/');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">טוען פרופיל...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans" dir="rtl">
      
      {/* כותרת */}
      <div className="bg-white p-5 shadow-sm border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10">
         <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600">
            <ArrowRight size={18} />
         </Link>
         <h1 className="text-lg font-black text-slate-800">הפרופיל שלי</h1>
      </div>

      <div className="p-5 space-y-6 max-w-lg mx-auto">
         
         {/* כרטיס ראשי */}
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-400 border-4 border-slate-50 shadow-inner">
               <User size={40} />
            </div>
            <h2 className="text-xl font-black text-slate-900">{user.first_name} {user.last_name}</h2>
            <p className="text-slate-500 text-sm mb-4">{user.branch_name}</p>
            
            <div className="flex justify-center gap-2">
               <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Shield size={12} /> שליח
               </span>
               <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold font-mono">
                  ID: {user.teudat_zehut}
               </span>
            </div>
         </div>

         {/* פרטים אישיים */}
         <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
               <User size={18} className="text-blue-500"/> פרטי קשר
            </div>
            <div className="divide-y divide-slate-50">
               <div className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Phone size={16}/></div>
                  <div>
                     <div className="text-xs text-slate-400">טלפון נייד</div>
                     <div className="font-bold text-slate-700">{user.phone || '-'}</div>
                  </div>
               </div>
               <div className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600"><Heart size={16}/></div>
                  <div>
                     <div className="text-xs text-slate-400">שם האישה</div>
                     <div className="font-bold text-slate-700">{user.spouse_first_name || '-'}</div>
                  </div>
               </div>
               <div className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600"><Phone size={16}/></div>
                  <div>
                     <div className="text-xs text-slate-400">טלפון האישה</div>
                     <div className="font-bold text-slate-700">{user.spouse_phone || '-'}</div>
                  </div>
               </div>
            </div>
         </div>

         {/* מנוי */}
         <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
               <CreditCard size={18} className="text-purple-500"/> מנוי וחיובים
            </div>
            <div className="p-6 text-center">
               {user.subscription_types ? (
                  <>
                     <div className="text-purple-600 font-black text-xl mb-1">{user.subscription_types.name}</div>
                     <div className="text-slate-400 text-sm">חיוב חודשי: <b>₪{user.subscription_types.monthly_cost}</b></div>
                  </>
               ) : (
                  <div className="text-slate-400 text-sm">אין מנוי פעיל</div>
               )}
            </div>
         </div>

         {/* כפתור יציאה */}
         <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
            <LogOut size={20} /> יציאה מהמערכת
         </button>

      </div>
    </div>
  );
}