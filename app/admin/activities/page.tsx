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
      // תיקון: המרה בטוחה של הנתונים
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

    // תיקון: המרה לטקסט לפני שמירה
    const payload = {
      name: formData.name,
      category: formData.category,
      tiers: JSON.stringify(formData.tiers),
      custom_fields: JSON.stringify(formData.custom_fields),
      image_required: formData.image_required
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
        name: item.name, category: item.category, tiers: item.tiers, custom_fields: item.custom_fields, image_required: item.image_required
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
  const addField = () => setFormData(p => ({ ...p, custom_fields: [...p.custom_fields, { id: generateId(), label: '', type: 'text', required: false }] }));
  const removeField = (i: number) => setFormData(p => ({ ...p, custom_fields: p.custom_fields.filter((_, x) => x !== i) }));
  const updateField = (i: number, f: keyof CustomField, v: any) => {
      const n = [...formData.custom_fields];
      // @ts-ignore
      n[i][f] = v;
      setFormData({ ...formData, custom_fields: n });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div><h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Tags className="text-pink-600" /> הגדרות סוגי פעילות</h1></div>
         <button onClick={() => openModal()} className="bg-pink-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus size={20} /> פעילות חדשה</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {activities.map((act) => (
            <div key={act.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative flex flex-col h-full">
               <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-slate-800">{act.name}</h3>
                  <div className="flex gap-2">
                      <button onClick={() => openModal(act)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(act.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={16} /></button>
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
              <div className="overflow-y-auto flex-1 p-6 space-y-8 bg-slate-50">
                  {/* אותו תוכן טופס כמו בקוד המקורי שלך */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border">
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">שם</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded font-bold" /></div>
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">קטגוריה</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded"><option value="regular">פעילות שוטפת</option><option value="special">מיוחד</option></select></div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border">
                        <div className="flex justify-between mb-2"><label className="text-sm font-bold flex gap-2"><Users size={16}/> מדרגות</label><button onClick={addTier} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-bold">+ הוסף</button></div>
                        {formData.tiers.map((tier, i) => (
                            <div key={i} className="flex gap-2 items-center mb-2">
                                <input type="number" value={tier.min} onChange={e => updateTier(i, 'min', e.target.value)} className="w-16 p-2 border rounded text-center" />
                                <span>-</span>
                                <input type="number" value={tier.max} onChange={e => updateTier(i, 'max', e.target.value)} className="w-16 p-2 border rounded text-center" />
                                <span>=</span>
                                <input type="number" value={tier.amount} onChange={e => updateTier(i, 'amount', e.target.value)} className="w-full p-2 border rounded font-bold" />
                                <button onClick={() => removeTier(i)} className="text-red-400"><Trash2 size={16}/></button>
                            </div>
                        ))}
                  </div>
              </div>
              <div className="p-4 border-t bg-white flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100">ביטול</button>
                 <button onClick={handleSave} className="bg-pink-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg">שמור</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}