"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Tags, Plus, Edit2, Trash2, X, Users, ArrowRight, 
  ListPlus, CheckSquare, Image as ImageIcon, ToggleLeft, ToggleRight
} from "lucide-react";

interface Tier { min: number; max: number; amount: number; }
interface CustomField { id: string; label: string; type: string; required: boolean; }
interface ActivityType { id: string; name: string; category: string; tiers: Tier[]; custom_fields: CustomField[]; image_required: boolean; }

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function ActivityTypesPage() {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityType | null>(null);

  const [formData, setFormData] = useState({
    name: '', category: 'regular', tiers: [] as Tier[], custom_fields: [] as CustomField[], image_required: true 
  });

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('activity_types').select('*').order('name');
    if (error) console.error("Error:", error);
    else {
      const parsed = data.map((item: any) => ({
          ...item,
          tiers: typeof item.tiers === 'string' ? JSON.parse(item.tiers) : (item.tiers || []),
          custom_fields: typeof item.custom_fields === 'string' ? JSON.parse(item.custom_fields) : (item.custom_fields || [])
      }));
      setActivities(parsed);
    }
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.tiers.length === 0) return alert("חובה להגדיר מדרגות");

    const payload = {
      name: formData.name,
      category: formData.category,
      tiers: JSON.stringify(formData.tiers),
      custom_fields: JSON.stringify(formData.custom_fields),
      image_required: formData.image_required // נשמר לדאטה בייס
    };

    try {
      if (editingItem) {
        await supabase.from('activity_types').update(payload).eq('id', editingItem.id);
      } else {
        await supabase.from('activity_types').insert([payload]);
      }
      setIsModalOpen(false);
      fetchActivities();
    } catch (err: any) {
      alert("שגיאה: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק?")) return;
    await supabase.from('activity_types').delete().eq('id', id);
    fetchActivities();
  };

  const openModal = (item?: ActivityType) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name, 
        category: item.category, 
        tiers: item.tiers, 
        custom_fields: item.custom_fields, 
        // אם השדה לא קיים בבסיס הנתונים הישן, נגדיר כברירת מחדל true
        image_required: item.image_required !== undefined ? item.image_required : true
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', category: 'regular', tiers: [{ min: 1, max: 999, amount: 0 }], custom_fields: [], image_required: true });
    }
    setIsModalOpen(true);
  };

  // Helpers
  const addTier = () => setFormData(p => ({ ...p, tiers: [...p.tiers, { min: 0, max: 0, amount: 0 }] }));
  const removeTier = (i: number) => setFormData(p => ({ ...p, tiers: p.tiers.filter((_, x) => x !== i) }));
  const updateTier = (i: number, f: keyof Tier, v: string) => {
      const n = [...formData.tiers];
      // @ts-ignore
      n[i][f] = Number(v);
      setFormData({ ...formData, tiers: n });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div><h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Tags className="text-pink-600" /> הגדרות סוגי פעילות</h1></div>
         <button onClick={() => openModal()} className="bg-pink-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus size={20} /> פעילות חדשה</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {activities.map((act) => (
            <div key={act.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative flex flex-col h-full group hover:border-pink-200 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{act.name}</h3>
                    {/* חיווי האם תמונה חובה או לא */}
                    <div className="flex items-center gap-1 mt-1">
                        {act.image_required ? (
                            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <ImageIcon size={10} /> חובת תמונה
                            </span>
                        ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <ImageIcon size={10} /> תמונה רשות
                            </span>
                        )}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(act)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(act.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                  </div>
               </div>
               <div className="bg-slate-50 rounded-xl p-3 mt-auto space-y-1">
                   {act.tiers?.map((t, i) => (
                       <div key={i} className="flex justify-between text-xs text-slate-600"><span>{t.min}-{t.max}</span><span className="font-bold text-green-600">₪{t.amount}</span></div>
                   ))}
               </div>
            </div>
         ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-6 border-b bg-white">
                  <h2 className="text-xl font-bold">{editingItem ? 'עריכה' : 'חדש'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-slate-50">
                  
                  {/* אזור ההגדרות הראשיות */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border">
                        
                        {/* שם */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">שם הפעילות</label>
                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="לדוגמה: מבצע תפילין" />
                        </div>

                        {/* קטגוריה */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">קטגוריה</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                                <option value="regular">פעילות שוטפת</option>
                                <option value="special">מבצע מיוחד</option>
                            </select>
                        </div>

                        {/* --- התוספת החדשה: הגדרת תמונה --- */}
                        <div 
                            onClick={() => setFormData({ ...formData, image_required: !formData.image_required })}
                            className={`p-2 rounded-lg border-2 cursor-pointer flex items-center justify-between transition-all select-none ${formData.image_required ? 'border-pink-500 bg-pink-50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-md ${formData.image_required ? 'bg-pink-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    <ImageIcon size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${formData.image_required ? 'text-pink-900' : 'text-slate-600'}`}>תמונה</span>
                                    <span className="text-[10px] leading-none text-slate-400">{formData.image_required ? 'חובה להעלות' : 'רשות בלבד'}</span>
                                </div>
                            </div>
                            {formData.image_required ? <ToggleRight className="text-pink-500" size={24}/> : <ToggleLeft className="text-slate-300" size={24}/>}
                        </div>

                  </div>

                  {/* מדרגות */}
                  <div className="bg-white p-4 rounded-2xl border">
                        <div className="flex justify-between mb-4 border-b pb-2">
                            <label className="text-sm font-bold flex gap-2 items-center"><Users size={16} className="text-slate-400"/> מדרגות תגמול</label>
                            <button onClick={addTier} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold hover:bg-green-100 transition-colors">+ הוסף מדרגה</button>
                        </div>
                        {formData.tiers.map((tier, i) => (
                            <div key={i} className="flex gap-2 items-center mb-2">
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-xs text-slate-400">מ-</span>
                                    <input type="number" value={tier.min} onChange={e => updateTier(i, 'min', e.target.value)} className="w-16 p-1 bg-white border rounded text-center font-mono text-sm" />
                                    <span className="text-xs text-slate-400">עד-</span>
                                    <input type="number" value={tier.max} onChange={e => updateTier(i, 'max', e.target.value)} className="w-16 p-1 bg-white border rounded text-center font-mono text-sm" />
                                </div>
                                <span className="text-slate-300">=</span>
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₪</span>
                                    <input type="number" value={tier.amount} onChange={e => updateTier(i, 'amount', e.target.value)} className="w-full p-2 pl-6 border rounded-lg font-bold text-green-700" placeholder="סכום" />
                                </div>
                                <button onClick={() => removeTier(i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                            </div>
                        ))}
                        {formData.tiers.length === 0 && <div className="text-center py-4 text-slate-400 text-sm">אין מדרגות מוגדרות</div>}
                  </div>
              </div>

              <div className="p-4 border-t bg-white flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">ביטול</button>
                 <button onClick={handleSave} className="bg-pink-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg hover:bg-pink-700 transition-colors">שמור הגדרות</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}