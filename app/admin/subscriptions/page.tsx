"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, Plus, Trash2, Save, Users, 
  CheckCircle, Play, AlertTriangle, RefreshCw 
} from "lucide-react";

interface SubType {
  id: string;
  name: string;
  monthly_cost: number;
}

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  branch_name: string;
  subscription_id: string | null;
}

export default function SubscriptionsPage() {
  const [types, setTypes] = useState<SubType[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // יצירת מנוי חדש
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCost, setNewTypeCost] = useState('');

  // סטטוס הרצת חיוב
  const [billingProcessing, setBillingProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // 1. שליפת סוגי מנויים
    const { data: typesData } = await supabase.from('subscription_types').select('*').order('created_at');
    if (typesData) setTypes(typesData);

    // 2. שליפת משתמשים
    const { data: usersData } = await supabase.from('users').select('id, first_name, last_name, branch_name, subscription_id').order('first_name');
    if (usersData) setUsers(usersData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ניהול סוגי מנויים ---
  const addType = async () => {
    if (!newTypeName || !newTypeCost) return;
    const { error } = await supabase.from('subscription_types').insert([{
      name: newTypeName,
      monthly_cost: Number(newTypeCost)
    }]);
    
    if (!error) {
      setNewTypeName('');
      setNewTypeCost('');
      fetchData();
    }
  };

  const deleteType = async (id: string) => {
    if (!confirm("מחיקת מנוי תסיר אותו מכל המשתמשים המקושרים. להמשיך?")) return;
    // קודם מנקים מהמשתמשים
    await supabase.from('users').update({ subscription_id: null }).eq('subscription_id', id);
    // ואז מוחקים את הסוג
    await supabase.from('subscription_types').delete().eq('id', id);
    fetchData();
  };

  // --- שיוך משתמשים ---
  const handleAssignUser = async (userId: string, subId: string | null) => {
    // עדכון אופטימיסטי ב-UI
    setUsers(users.map(u => u.id === userId ? { ...u, subscription_id: subId } : u));
    
    // שמירה בשרת
    await supabase.from('users').update({ subscription_id: subId }).eq('id', userId);
  };

  // --- המנוע: הרצת חיוב חודשי ---
  const runMonthlyBilling = async () => {
    const monthName = new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
    
    if (!confirm(`האם אתה בטוח שברצונך לחייב את כל המנויים עבור חודש ${monthName}?\nפעולה זו תיצור עסקת "הוצאה" מאושרת לכל שליח שיש לו מנוי פעיל.`)) return;

    setBillingProcessing(true);
    let successCount = 0;
    let skipCount = 0;

    try {
      // עוברים על כל המשתמשים שיש להם מנוי
      const activeUsers = users.filter(u => u.subscription_id);

      for (const user of activeUsers) {
        const subType = types.find(t => t.id === user.subscription_id);
        if (!subType) continue;

        const title = `חיוב מנוי: ${subType.name} (${monthName})`;

        // 1. בדיקה האם כבר חויב החודש (למניעת כפילויות)
        // נחפש עסקה עם אותה כותרת בדיוק לאותו משתמש
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', title)
          .single();

        if (existing) {
          skipCount++;
          continue; // מדלגים, כבר חויב
        }

        // 2. יצירת חיוב
        await supabase.from('transactions').insert([{
          user_id: user.id,
          type: 'expense', // יורד מהיתרה
          amount: subType.monthly_cost,
          title: title,
          status: 'approved', // מאושר אוטומטית
          date: new Date().toISOString(),
          details: {
            notes: 'חיוב מנוי חודשי אוטומטי',
            mode: 'subscription_charge'
          }
        }]);
        
        successCount++;
      }

      alert(`התהליך הסתיים!\n✅ חויבו בהצלחה: ${successCount} שליחים\n⚠️ דולגו (כבר חויבו החודש): ${skipCount} שליחים`);

    } catch (err) {
      console.error(err);
      alert("אירעה שגיאה בתהליך החיוב");
    } finally {
      setBillingProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* כותרת ראשית */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <CreditCard className="text-purple-600" /> ניהול מנויים וחיובים
            </h1>
            <p className="text-slate-500 text-sm mt-1">הגדרת תשלומים קבועים וחיוב אוטומטי</p>
         </div>
         <button 
           onClick={runMonthlyBilling}
           disabled={billingProcessing}
           className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-slate-900/20 disabled:opacity-70 transition-all"
         >
           {billingProcessing ? (
             <>מעבד נתונים...</>
           ) : (
             <><Play size={20} fill="white" /> הרץ חיוב חודשי</>
           )}
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* צד ימין: ניהול סוגי מנויים */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                 <Plus size={20} className="text-purple-600"/> סוגי מנויים
              </h2>
              
              {/* הוספה */}
              <div className="flex flex-col gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <input 
                   placeholder="שם המנוי (למשל: דמי רצינות)" 
                   className="p-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-purple-500"
                   value={newTypeName}
                   onChange={e => setNewTypeName(e.target.value)}
                 />
                 <div className="flex gap-2">
                    <input 
                      type="number"
                      placeholder="מחיר לחודש" 
                      className="p-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-purple-500 w-full"
                      value={newTypeCost}
                      onChange={e => setNewTypeCost(e.target.value)}
                    />
                    <button onClick={addType} className="bg-purple-600 text-white p-3 rounded-lg font-bold hover:bg-purple-700">
                       הוסף
                    </button>
                 </div>
              </div>

              {/* רשימה */}
              <div className="space-y-3">
                 {types.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-purple-200 transition-colors">
                       <div>
                          <div className="font-bold text-slate-800">{t.name}</div>
                          <div className="text-sm text-slate-500">₪{t.monthly_cost} לחודש</div>
                       </div>
                       <button onClick={() => deleteType(t.id)} className="text-slate-400 hover:text-red-500 p-2">
                          <Trash2 size={18} />
                       </button>
                    </div>
                 ))}
                 {types.length === 0 && <p className="text-center text-slate-400 text-sm py-4">אין סוגי מנויים מוגדרים</p>}
              </div>
           </div>
           
           {/* כרטיס הסבר */}
           <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
              <div className="flex gap-2 items-start text-blue-800">
                 <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                 <div>
                    <h4 className="font-bold text-sm">איך זה עובד?</h4>
                    <p className="text-xs mt-1 leading-relaxed opacity-80">
                       1. צור סוגי מנויים בצד ימין.<br/>
                       2. שייך שליחים למנויים בטבלה משמאל.<br/>
                       3. ב-1 לכל חודש (או מתי שתבחר), לחץ על הכפתור השחור למעלה <b>"הרץ חיוב חודשי"</b>.<br/>
                       המערכת תיצור אוטומטית חיובים לכל מי שמוגדר.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* צד שמאל: טבלת משתמשים ושיוך */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                 <Users size={20} className="text-purple-600"/> שיוך שליחים
              </h2>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{users.length} משתמשים</span>
           </div>
           
           <div className="overflow-auto flex-1 max-h-[600px]">
              <table className="w-full text-right">
                 <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0 z-10">
                    <tr>
                       <th className="px-6 py-4">שם השליח</th>
                       <th className="px-6 py-4">סניף</th>
                       <th className="px-6 py-4">מנוי נוכחי</th>
                       <th className="px-6 py-4">סטטוס</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loading ? (
                       <tr><td colSpan={4} className="text-center py-10 text-slate-400">טוען...</td></tr>
                    ) : users.map(u => (
                       <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{u.first_name} {u.last_name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{u.branch_name}</td>
                          <td className="px-6 py-4">
                             <select 
                               value={u.subscription_id || ''} 
                               onChange={(e) => handleAssignUser(u.id, e.target.value || null)}
                               className={`w-full p-2 rounded-lg border text-sm font-bold outline-none cursor-pointer ${
                                 u.subscription_id ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-400'
                               }`}
                             >
                                <option value="">ללא מנוי</option>
                                {types.map(t => (
                                   <option key={t.id} value={t.id}>{t.name} - ₪{t.monthly_cost}</option>
                                ))}
                             </select>
                          </td>
                          <td className="px-6 py-4">
                             {u.subscription_id ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                                   <CheckCircle size={12}/> פעיל
                                </span>
                             ) : (
                                <span className="text-xs text-slate-400 font-medium">לא משויך</span>
                             )}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
}