"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Tags, Plus, Edit2, Trash2, X, Users, ArrowRight, 
  ListPlus, CheckSquare, Type, Calendar, Image as ImageIcon 
} from "lucide-react";

// --- Interfaces ---

interface Tier {
  min: number;
  max: number;
  amount: number;
}

interface CustomField {
  id: string;
  label: string;      // השאלה עצמה (למשל: "האם חולק כיבוד?")
  type: 'text' | 'number' | 'boolean' | 'long-text'; // סוג התשובה
  required: boolean;  // האם חובה למלא
}

interface ActivityType {
  id: string;
  name: string;
  category: string;
  tiers: Tier[];
  custom_fields: CustomField[]; // רשימת השדות הדינמיים
}

// --- Helper for Random ID ---
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function ActivityTypesPage() {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityType | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'regular',
    tiers: [] as Tier[],
    custom_fields: [] as CustomField[]
  });

  const fetchActivities = async () => {
    setLoading(true);
    // חשוב: לוודא שבוחרים גם את העמודה החדשה custom_fields
    const { data } = await supabase.from('activity_types').select('*').order('name');
    setActivities(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.tiers.length === 0) {
        alert("חובה להגדיר לפחות מדרגת תשלום אחת.");
        return;
    }

    const payload = {
      name: formData.name,
      category: formData.category,
      tiers: formData.tiers,
      custom_fields: formData.custom_fields // שמירת השדות הדינמיים
    };

    if (editingItem) {
      await supabase.from('activity_types').update(payload).eq('id', editingItem.id);
    } else {
      await supabase.from('activity_types').insert([payload]);
    }
    
    setIsModalOpen(false);
    fetchActivities();
  };

  const handleDelete = async (id: string) => {
    if (confirm("האם למחוק סוג פעילות זה?")) {
      await supabase.from('activity_types').delete().eq('id', id);
      fetchActivities();
    }
  };

  const openModal = (item?: ActivityType) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        tiers: item.tiers || [],
        custom_fields: item.custom_fields || []
      });
    } else {
      setEditingItem(null);
      setFormData({ 
          name: '', 
          category: 'regular', 
          tiers: [{ min: 1, max: 999, amount: 0 }],
          custom_fields: [] 
      });
    }
    setIsModalOpen(true);
  };

  // --- ניהול מדרגות ---
  const addTier = () => {
      setFormData({
          ...formData,
          tiers: [...formData.tiers, { min: 0, max: 0, amount: 0 }]
      });
  };

  const removeTier = (index: number) => {
      const newTiers = [...formData.tiers];
      newTiers.splice(index, 1);
      setFormData({ ...formData, tiers: newTiers });
  };

  const updateTier = (index: number, field: keyof Tier, value: string) => {
      const newTiers = [...formData.tiers];
      newTiers[index] = { ...newTiers[index], [field]: Number(value) };
      setFormData({ ...formData, tiers: newTiers });
  };

  // --- ניהול שדות מותאמים אישית (שאלות) ---
  const addField = () => {
    const newField: CustomField = {
      id: generateId(),
      label: '',
      type: 'text',
      required: false
    };
    setFormData({ ...formData, custom_fields: [...formData.custom_fields, newField] });
  };

  const removeField = (index: number) => {
    const newFields = [...formData.custom_fields];
    newFields.splice(index, 1);
    setFormData({ ...formData, custom_fields: newFields });
  };

  const updateField = (index: number, field: keyof CustomField, value: any) => {
    const newFields = [...formData.custom_fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setFormData({ ...formData, custom_fields: newFields });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* כותרת עמוד */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <Tags className="text-pink-600" /> הגדרות סוגי פעילות
            </h1>
            <p className="text-slate-500 text-sm mt-1">ניהול שכר, מדרגות ושאלות דיווח</p>
         </div>
         <button onClick={() => openModal()} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
            <Plus size={20} /> פעילות חדשה
         </button>
      </div>

      {/* רשימת הכרטיסים */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {activities.map((act) => (
            <div key={act.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative flex flex-col h-full">
               <div className="flex justify-between items-start mb-4">
                  <div>
                      <h3 className="font-bold text-lg text-slate-800">{act.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{act.category === 'regular' ? 'שוטף' : 'מיוחד'}</span>
                        {act.custom_fields && act.custom_fields.length > 0 && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full flex items-center gap-1">
                            <ListPlus size={12}/> {act.custom_fields.length} שאלות
                          </span>
                        )}
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => openModal(act)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(act.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                  </div>
               </div>
               
               {/* תצוגה מקוצרת של מדרגות */}
               <div className="bg-slate-50 rounded-xl p-3 mt-auto">
                   <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">מדרגות תשלום:</p>
                   <div className="space-y-1">
                       {act.tiers?.slice(0, 3).map((t, idx) => (
                           <div key={idx} className="flex justify-between text-xs text-slate-600">
                               <span>{t.min}-{t.max} משתתפים</span>
                               <span className="font-bold text-green-600">₪{t.amount}</span>
                           </div>
                       ))}
                       {act.tiers?.length > 3 && <div className="text-xs text-slate-400 pt-1">+ עוד {act.tiers.length - 3} מדרגות...</div>}
                   </div>
               </div>
            </div>
         ))}
      </div>

      {/* מודל עריכה/הוספה */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                  <h2 className="text-xl font-bold text-slate-800">{editingItem ? 'עריכת פעילות' : 'פעילות חדשה'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
              </div>
              
              <div className="overflow-y-auto flex-1 p-6 space-y-8 bg-slate-50/50">
                  
                  {/* פרטים כלליים */}
                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">שם הפעילות</label>
                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all" placeholder="לדוגמה: מסיבת ראש חודש" />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">קטגוריה</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 rounded-xl border bg-white outline-none focus:border-pink-500">
                            <option value="regular">פעילות שוטפת</option>
                            <option value="special">אירוע מיוחד/שיא</option>
                            </select>
                        </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* עמודה ימנית: שאלות ונתונים */}
                    <div className="space-y-6">
                        {/* שדות קבועים (לקריאה בלבד) */}
                        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 opacity-70">
                            <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                                <CheckSquare size={16} /> שדות חובה גלובליים (קבוע לכולם)
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                <div className="bg-white p-2 rounded border border-slate-200 flex items-center gap-2"><Users size={14}/> קהל (בנים/בנות)</div>
                                <div className="bg-white p-2 rounded border border-slate-200 flex items-center gap-2"><Calendar size={14}/> תאריך ושעה</div>
                                <div className="bg-white p-2 rounded border border-slate-200 flex items-center gap-2"><Users size={14}/> כמות משתתפים</div>
                                <div className="bg-white p-2 rounded border border-slate-200 flex items-center gap-2"><ImageIcon size={14}/> תמונה (אופציונלי)</div>
                            </div>
                        </div>

                        {/* שדות מותאמים אישית */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <ListPlus size={16} className="text-purple-600"/> שאלות נוספות לדיווח
                                </label>
                                <button type="button" onClick={addField} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100 transition-colors">
                                    + הוסף שאלה
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.custom_fields.map((field, index) => (
                                    <div key={field.id || index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex-1 w-full">
                                            <input 
                                                type="text" 
                                                placeholder="השאלה (למשל: האם חולק פיצה?)" 
                                                value={field.label} 
                                                onChange={e => updateField(index, 'label', e.target.value)}
                                                className="w-full text-sm bg-white p-2 rounded border outline-none focus:border-purple-500"
                                            />
                                        </div>
                                        <div className="w-full sm:w-32">
                                            <select 
                                                value={field.type} 
                                                onChange={e => updateField(index, 'type', e.target.value)}
                                                className="w-full text-sm bg-white p-2 rounded border outline-none focus:border-purple-500"
                                            >
                                                <option value="text">טקסט קצר</option>
                                                <option value="long-text">טקסט ארוך</option>
                                                <option value="number">מספר</option>
                                                <option value="boolean">כן / לא</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                                            <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={field.required}
                                                    onChange={e => updateField(index, 'required', e.target.checked)}
                                                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className={field.required ? "font-bold text-slate-700" : "text-slate-400"}>חובה</span>
                                            </label>
                                            <button type="button" onClick={() => removeField(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {formData.custom_fields.length === 0 && (
                                    <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-xs">אין שאלות מיוחדות לפעילות זו.</p>
                                        <p className="text-xs">הדיווח יכלול רק את שדות החובה.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* עמודה שמאלית: מדרגות שכר */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-fit">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Users size={16} className="text-green-600"/> מדרגות תשלום
                            </label>
                            <button type="button" onClick={addTier} className="text-xs bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-lg font-bold hover:bg-green-100 transition-colors">
                                + הוסף מדרגה
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="grid grid-cols-8 gap-2 text-xs text-slate-400 font-bold px-1 mb-2">
                                <div className="col-span-2">מ-</div>
                                <div className="col-span-1"></div>
                                <div className="col-span-2">עד</div>
                                <div className="col-span-2">תשלום</div>
                                <div className="col-span-1"></div>
                            </div>
                            
                            {formData.tiers.map((tier, index) => (
                                <div key={index} className="grid grid-cols-8 gap-2 items-center">
                                    <div className="col-span-2">
                                        <input type="number" placeholder="0" value={tier.min} onChange={e => updateTier(index, 'min', e.target.value)} className="w-full p-2 text-sm rounded-lg border text-center outline-none focus:border-green-500" />
                                    </div>
                                    <div className="col-span-1 flex justify-center text-slate-300"><ArrowRight size={14}/></div>
                                    <div className="col-span-2">
                                        <input type="number" placeholder="999" value={tier.max} onChange={e => updateTier(index, 'max', e.target.value)} className="w-full p-2 text-sm rounded-lg border text-center outline-none focus:border-green-500" />
                                    </div>
                                    <div className="col-span-2 relative">
                                        <input type="number" placeholder="₪" value={tier.amount} onChange={e => updateTier(index, 'amount', e.target.value)} className="w-full p-2 pl-5 text-sm rounded-lg border outline-none font-bold text-slate-700 focus:border-green-500" />
                                        <span className="absolute left-2 top-2.5 text-slate-400 text-xs">₪</span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <button type="button" onClick={() => removeTier(index)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-slate-100 bg-white">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">ביטול</button>
                 <button type="submit" onClick={handleSave} className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-bold shadow-lg shadow-pink-600/20 hover:bg-pink-700 transition-colors">שמור הגדרות</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}