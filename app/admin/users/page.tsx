"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, FileSpreadsheet, Trash2, Edit, Phone, MapPin, User, Check, X, Loader2
} from "lucide-react";
import { supabase } from '@/lib/supabase';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // טופס הוספה
  const [formData, setFormData] = useState({
    teudat_zehut: '',
    first_name: '',
    last_name: '',
    phone: '',
    branch_name: '',
    email: '',
    spouse_name: '',
    spouse_tz: '',
    spouse_phone: ''
  });

  // שליפת משתמשים
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // הוספת משתמש חדש
  const handleCreateUser = async () => {
    if (!formData.teudat_zehut || !formData.first_name) {
      alert("חובה למלא ת.ז ושם פרטי");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('users').insert([
        {
          teudat_zehut: formData.teudat_zehut,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          branch_name: formData.branch_name,
          email: formData.email,
          spouse_name: formData.spouse_name,
          spouse_tz: formData.spouse_tz,
          spouse_phone: formData.spouse_phone,
          balance: 0,
          role: 'shaliach'
        }
      ]);

      if (error) throw error;

      alert("השליח נוסף בהצלחה!");
      setShowAddModal(false);
      setFormData({
        teudat_zehut: '', first_name: '', last_name: '', phone: '', branch_name: '',
        email: '', spouse_name: '', spouse_tz: '', spouse_phone: ''
      });
      fetchUsers(); // רענון הטבלה

    } catch (error: any) {
      console.error('Error creating user:', error);
      alert("שגיאה ביצירת משתמש: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // מחיקת משתמש
  const handleDeleteUser = async (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק שליח זה? פעולה זו תמחק גם את כל הדיווחים שלו.")) return;

    try {
      // בגלל ה-CASCADE שהגדרנו ב-SQL, זה ימחק גם את ההודעות והעסקאות שלו
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert("שגיאה במחיקה");
    }
  };

  // סינון לפי חיפוש
  const filteredUsers = users.filter(user => 
    user.first_name?.includes(searchTerm) || 
    user.last_name?.includes(searchTerm) || 
    user.branch_name?.includes(searchTerm) ||
    user.teudat_zehut?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 pb-20">
      
      {/* כותרת וכפתורים */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">ניהול שלוחים</h2>
          <p className="text-slate-500 mt-1">סה"כ {users.length} סניפים רשומים במערכת</p>
        </div>
        
        <div className="flex gap-3">
           <button 
             className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all opacity-50 cursor-not-allowed"
             title="בקרוב"
           >
             <FileSpreadsheet size={20} />
             ייבוא מאקסל
           </button>
           
           <button 
             onClick={() => setShowAddModal(true)}
             className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all"
           >
             <Plus size={20} />
             הוסף ידנית
           </button>
        </div>
      </div>

      {/* סרגל חיפוש */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="חיפוש לפי שם, סניף, ת.ז..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
          />
        </div>
      </div>

      {/* טעינה */}
      {loading && (
        <div className="text-center py-10">
           <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
           <p className="text-slate-500 mt-2">טוען רשימת שלוחים...</p>
        </div>
      )}

      {/* טבלת שליחים */}
      {!loading && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-sm uppercase">
            <tr>
              <th className="px-6 py-4">סניף ושם השליח</th>
              <th className="px-6 py-4">פרטי האישה</th>
              <th className="px-6 py-4">תעודות זהות (לכניסה)</th>
              <th className="px-6 py-4">יצירת קשר</th>
              <th className="px-6 py-4">מאזן</th>
              <th className="px-6 py-4">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                
                {/* עמודה 1: שליח וסניף */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2.5 rounded-full text-blue-600">
                       <User size={20} />
                    </div>
                    <div>
                       <div className="font-bold text-slate-900 text-lg">{user.first_name} {user.last_name}</div>
                       <div className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin size={12} /> {user.branch_name}
                       </div>
                    </div>
                  </div>
                </td>

                {/* עמודה 2: אישה */}
                <td className="px-6 py-4">
                   <div className="font-bold text-slate-700">{user.spouse_name || '-'}</div>
                   <div className="text-xs text-slate-400 mt-0.5 dir-ltr text-right">{user.spouse_phone}</div>
                </td>

                {/* עמודה 3: ת.ז */}
                <td className="px-6 py-4">
                   <div className="space-y-1">
                      <div className="text-xs bg-slate-100 px-2 py-0.5 rounded w-fit text-slate-600">
                         שלו: <span className="font-mono font-bold">{user.teudat_zehut}</span>
                      </div>
                      {user.spouse_tz && (
                        <div className="text-xs bg-slate-100 px-2 py-0.5 rounded w-fit text-slate-600">
                           שלה: <span className="font-mono font-bold">{user.spouse_tz}</span>
                        </div>
                      )}
                   </div>
                </td>

                {/* עמודה 4: קשר */}
                <td className="px-6 py-4">
                  <div className="text-sm space-y-1">
                     <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={14} /> {user.phone}
                     </div>
                     <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                </td>

                {/* עמודה 5: מאזן */}
                <td className="px-6 py-4">
                  <span className={`text-lg font-black dir-ltr ${user.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₪{user.balance?.toLocaleString()}
                  </span>
                </td>

                {/* עמודה 6: פעולות */}
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors" title="ערוך פרטים">
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors" 
                      title="מחק שליח"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}


      {/* --- מודל הוספה ידנית (מחובר ל-DB) --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                   <User className="text-blue-600" />
                   הוספת שליח חדש
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
             </div>
             
             <div className="p-8 overflow-y-auto">
                <div className="grid grid-cols-2 gap-8">
                   {/* צד שליח */}
                   <div className="space-y-4">
                      <h4 className="font-bold text-blue-600 border-b border-blue-100 pb-2">פרטי השליח</h4>
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">מספר תעודת זהות *</label>
                         <input 
                           type="text" required
                           value={formData.teudat_zehut}
                           onChange={(e) => setFormData({...formData, teudat_zehut: e.target.value})}
                           className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" 
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">שם פרטי *</label>
                            <input type="text" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                         </div>
                         <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">שם משפחה *</label>
                            <input type="text" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                         </div>
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">טלפון נייד</label>
                         <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                      </div>
                   </div>

                   {/* צד אישה */}
                   <div className="space-y-4">
                      <h4 className="font-bold text-pink-600 border-b border-pink-100 pb-2">פרטי האישה (השליחה)</h4>
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">מספר תעודת זהות</label>
                         <input type="text" value={formData.spouse_tz} onChange={(e) => setFormData({...formData, spouse_tz: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500" />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">שם פרטי</label>
                         <input type="text" value={formData.spouse_name} onChange={(e) => setFormData({...formData, spouse_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500" />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">טלפון נייד</label>
                         <input type="text" value={formData.spouse_phone} onChange={(e) => setFormData({...formData, spouse_phone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500" />
                      </div>
                   </div>
                </div>

                <div className="mt-8 space-y-4">
                   <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">פרטי סניף וכללי</h4>
                   <div className="grid grid-cols-2 gap-8">
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">שם הסניף</label>
                         <input type="text" value={formData.branch_name} onChange={(e) => setFormData({...formData, branch_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500" />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">אימייל ראשי</label>
                         <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500" />
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                   <button onClick={() => setShowAddModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">ביטול</button>
                   <button 
                     onClick={handleCreateUser}
                     disabled={isSubmitting}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
                   >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                      שמור שליח במערכת
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}