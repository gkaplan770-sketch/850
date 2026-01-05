"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { 
  Search, Plus, Edit2, Trash2, User, Users,
  MapPin, Hash, Save, X, Upload, FileSpreadsheet, Download 
} from "lucide-react";

interface UserData {
  id: string;
  created_at: string;
  teudat_zehut: string;
  first_name: string;
  last_name: string;
  branch_name: string;
  phone?: string;
  spouse_first_name?: string;
  spouse_phone?: string;
  role: 'admin' | 'shaliach';
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // מודל הוספה/עריכה
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // טופס
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    teudat_zehut: '',
    branch_name: '',
    phone: '',
    spouse_first_name: '',
    spouse_phone: '',
    role: 'shaliach'
  });

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('branch_name', { ascending: true });

    if (!error) setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.first_name.includes(searchTerm) || 
    u.last_name.includes(searchTerm) || 
    u.branch_name.includes(searchTerm) ||
    u.teudat_zehut.includes(searchTerm)
  );

  const openModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        teudat_zehut: user.teudat_zehut,
        branch_name: user.branch_name,
        phone: user.phone || '',
        spouse_first_name: user.spouse_first_name || '',
        spouse_phone: user.spouse_phone || '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        first_name: '', last_name: '', teudat_zehut: '', branch_name: '', phone: '', 
        spouse_first_name: '', spouse_phone: '', role: 'shaliach'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teudat_zehut || !formData.first_name || !formData.branch_name) {
      alert("נא למלא שדות חובה");
      return;
    }

    try {
      if (editingUser) {
        const { error } = await supabase.from('users').update(formData).eq('id', editingUser.id);
        if (error) throw error;
      } else {
        const { data: exist } = await supabase.from('users').select('id').eq('teudat_zehut', formData.teudat_zehut).single();
        if (exist) { alert("ת.ז כבר קיימת!"); return; }
        const { error } = await supabase.from('users').insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("שגיאה בשמירה");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק משתמש זה?")) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) alert("לא ניתן למחוק משתמש עם היסטוריה כספית.");
      else fetchUsers();
    } catch (err) { console.error(err); }
  };

  // --- ייבוא מאקסל ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        
        // כאן התיקון: הסרנו את הטייפ מהלולאה
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let failCount = 0;

        // התיקון כאן: במקום (const row: any of data) כתבנו פשוט (const row of data)
        for (const row of data) {
          const newUser = {
            teudat_zehut: row['teudat_zehut'] || row['id'] || row['תעודת זהות'],
            first_name: row['first_name'] || row['name'] || row['שם פרטי'],
            last_name: row['last_name'] || row['family'] || row['שם משפחה'],
            branch_name: row['branch_name'] || row['branch'] || row['סניף'],
            phone: row['phone'] || row['tel'] || row['טלפון'],
            spouse_first_name: row['spouse_first_name'] || row['wife_name'] || row['שם האישה'],
            spouse_phone: row['spouse_phone'] || row['wife_phone'] || row['טלפון אישה'],
            role: 'shaliach'
          };

          if (newUser.teudat_zehut && newUser.first_name) {
            // בדיקה אם קיים
            const { data: exist } = await supabase.from('users').select('id').eq('teudat_zehut', newUser.teudat_zehut).single();
            
            if (!exist) {
               const cleanUser = {
                 ...newUser,
                 teudat_zehut: String(newUser.teudat_zehut),
                 phone: newUser.phone ? String(newUser.phone) : '',
                 spouse_phone: newUser.spouse_phone ? String(newUser.spouse_phone) : ''
               };
               
               const { error } = await supabase.from('users').insert([cleanUser]);
               if (!error) successCount++;
               else failCount++;
            } else {
              failCount++; 
            }
          }
        }

        alert(`התהליך הסתיים:\n${successCount} משתמשים נוספו בהצלחה.\n${failCount} נכשלו (או שהיו קיימים כבר).`);
        fetchUsers();

      } catch (err) {
        console.error(err);
        alert("שגיאה בקריאת הקובץ. וודא שהוא תקין.");
      } finally {
        setIsUploading(false);
        e.target.value = ''; 
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      teudat_zehut: "123456789",
      first_name: "ישראל",
      last_name: "ישראלי",
      branch_name: "חב״ד לנוער מרכז",
      phone: "0501234567",
      spouse_first_name: "רחלי",
      spouse_phone: "0507654321"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_shluchim.xlsx");
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* כותרת ופעולות */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <Users className="text-blue-600" /> ניהול שלוחים ומשפחות
            </h1>
            <p className="text-slate-500 text-sm mt-1">סה"כ {users.length} משתמשים במערכת</p>
         </div>
         
         <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            {/* חיפוש */}
            <div className="relative flex-1">
               <input 
                 type="text" 
                 placeholder="חיפוש..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
               />
               <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
            
            {/* כפתורי אקסל */}
            <div className="flex gap-2">
                <button 
                  onClick={downloadTemplate}
                  className="bg-green-50 text-green-700 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-100 transition-colors"
                  title="הורד תבנית אקסל"
                >
                  <Download size={20} /> <span className="hidden lg:inline">תבנית</span>
                </button>
                
                <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all">
                   {isUploading ? "טוען..." : <><FileSpreadsheet size={20} /> <span className="hidden lg:inline">טען אקסל</span></>}
                   <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                </label>
            </div>

            <button 
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
            >
               <Plus size={20} /> <span className="hidden lg:inline">הוסף ידנית</span>
            </button>
         </div>
      </div>

      {/* טבלה */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
         <table className="w-full text-right min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
               <tr>
                  <th className="px-6 py-4">שם השליח/ה</th>
                  <th className="px-6 py-4">סניף</th>
                  <th className="px-6 py-4">פרטי קשר (שליח)</th>
                  <th className="px-6 py-4">פרטי קשר (אישה)</th>
                  <th className="px-6 py-4">תעודת זהות</th>
                  <th className="px-6 py-4">פעולות</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{u.first_name} {u.last_name}</div>
                        {u.spouse_first_name && <div className="text-xs text-slate-500 mt-0.5">רעייה: {u.spouse_first_name}</div>}
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit text-sm font-medium">
                           <MapPin size={14} /> {u.branch_name}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-sm text-slate-600">{u.phone || '-'}</td>
                     <td className="px-6 py-4 text-sm text-slate-600">{u.spouse_phone || '-'}</td>
                     <td className="px-6 py-4 font-mono text-slate-500 text-sm">{u.teudat_zehut}</td>
                     <td className="px-6 py-4">
                        <div className="flex gap-2">
                           <button onClick={() => openModal(u)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={18} /></button>
                           <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* מודל */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
                 <h2 className="font-bold text-lg">{editingUser ? 'עריכת פרטים' : 'הוספת שליח חדש'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* פרטי השליח */}
                    <div className="space-y-4">
                       <h3 className="font-bold text-blue-600 border-b pb-2">פרטי השליח</h3>
                       <div><label className="text-xs font-bold text-slate-500">שם פרטי *</label><input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500" /></div>
                       <div><label className="text-xs font-bold text-slate-500">שם משפחה *</label><input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500" /></div>
                       <div><label className="text-xs font-bold text-slate-500">תעודת זהות (כניסה) *</label><input required value={formData.teudat_zehut} onChange={e => setFormData({...formData, teudat_zehut: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500 font-mono" /></div>
                       <div><label className="text-xs font-bold text-slate-500">טלפון נייד</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500" /></div>
                    </div>
                    
                    {/* פרטי האישה והסניף */}
                    <div className="space-y-4">
                       <h3 className="font-bold text-pink-600 border-b pb-2">פרטי האישה והסניף</h3>
                       <div><label className="text-xs font-bold text-slate-500">שם האישה</label><input value={formData.spouse_first_name} onChange={e => setFormData({...formData, spouse_first_name: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500" /></div>
                       <div><label className="text-xs font-bold text-slate-500">טלפון האישה</label><input value={formData.spouse_phone} onChange={e => setFormData({...formData, spouse_phone: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500" /></div>
                       <div className="pt-2"><label className="text-xs font-bold text-slate-500">שם הסניף *</label><input required value={formData.branch_name} onChange={e => setFormData({...formData, branch_name: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500 bg-slate-50" /></div>
                       <div>
                          <label className="text-xs font-bold text-slate-500">תפקיד</label>
                          <select value={formData.role} onChange={(e: any) => setFormData({...formData, role: e.target.value})} className="w-full p-3 rounded-xl border bg-white">
                             <option value="shaliach">שליח</option>
                             <option value="admin">מנהל</option>
                          </select>
                       </div>
                    </div>
                 </div>
                 <button type="submit" className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg">שמור פרטים</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}