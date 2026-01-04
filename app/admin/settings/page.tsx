"use client";

import React, { useState } from 'react';
import { Save, Plus, Trash2, X, ListPlus, GripVertical, DollarSign, Calendar, Users, Clock, CheckCircle2, Image as ImageIcon } from "lucide-react";

export default function AdminSettingsPage() {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // מבנה נתונים
  const emptyActivity = {
    id: 0,
    name: "",
    imageRequirement: "optional", // 'none', 'optional', 'mandatory'
    pricing: [{ min: 0, max: 0, price: 0 }],
    customQuestions: [{ question: "", type: "text" }] 
  };

  const [currentActivity, setCurrentActivity] = useState(emptyActivity);

  const [activities, setActivities] = useState([
    {
      id: 1,
      name: "שיעור שבועי",
      imageRequirement: "optional",
      pricing: [{ min: 0, max: 20, price: 100 }],
      customQuestions: [{ question: "מה היה נושא השיעור?", type: "text" }]
    },
    {
      id: 2,
      name: "פעילות שיא",
      imageRequirement: "mandatory",
      pricing: [
        { min: 0, max: 50, price: 500 },
        { min: 51, max: 100, price: 1000 }
      ],
      customQuestions: [
        { question: "האם חולק כיבוד?", type: "yes_no" },
        { question: "ציין מיקום מדויק", type: "location" }
      ]
    }
  ]);

  // --- פונקציות ניהול ---

  const handleAddNew = () => {
    setCurrentActivity({ ...emptyActivity, id: Date.now() });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (activity: any) => {
    setCurrentActivity({ ...activity });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = () => {
    if (isEditing) {
      setActivities(activities.map(a => a.id === currentActivity.id ? currentActivity : a));
    } else {
      setActivities([...activities, currentActivity]);
    }
    setShowModal(false);
  };

  // --- פונקציות עזר לטפסים ---

  const addPricingTier = () => {
    setCurrentActivity({
      ...currentActivity,
      pricing: [...currentActivity.pricing, { min: 0, max: 0, price: 0 }]
    });
  };

  const removePricingTier = (index: number) => {
    const updated = [...currentActivity.pricing];
    updated.splice(index, 1);
    setCurrentActivity({ ...currentActivity, pricing: updated });
  };

  const updatePricing = (index: number, field: string, value: string) => {
    const updated = [...currentActivity.pricing];
    updated[index] = { ...updated[index], [field]: Number(value) };
    setCurrentActivity({ ...currentActivity, pricing: updated });
  };

  const addQuestion = () => {
    setCurrentActivity({
      ...currentActivity,
      customQuestions: [...currentActivity.customQuestions, { question: "", type: "text" }]
    });
  };

  const removeQuestion = (index: number) => {
    const updated = [...currentActivity.customQuestions];
    updated.splice(index, 1);
    setCurrentActivity({ ...currentActivity, customQuestions: updated });
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...currentActivity.customQuestions];
    updated[index].question = text;
    setCurrentActivity({ ...currentActivity, customQuestions: updated });
  };

  const updateQuestionType = (index: number, type: string) => {
    const updated = [...currentActivity.customQuestions];
    updated[index].type = type;
    setCurrentActivity({ ...currentActivity, customQuestions: updated });
  };

  return (
    <div className="space-y-8 pb-20">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">הגדרות סוגי פעילות</h2>
          <p className="text-slate-500 mt-1">נהל את סוגי הפעילויות, התמחור והשאלות</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} />
          הוסף סוג פעילות חדש
        </button>
      </div>

      <div className="grid gap-6">
        {activities.map((activity, index) => (
          <div key={activity.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex justify-between items-center hover:shadow-md transition-shadow">
             <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-full font-bold text-slate-600">{index + 1}</div>
                <div>
                   <h3 className="text-xl font-bold text-slate-900">{activity.name}</h3>
                   <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{activity.customQuestions.length} שאלות מותאמות</span>
                      <span>•</span>
                      <span className={`${activity.imageRequirement === 'mandatory' ? 'text-red-500 font-bold' : ''}`}>
                         {activity.imageRequirement === 'mandatory' ? 'תמונה חובה' : activity.imageRequirement === 'optional' ? 'תמונה רשות' : 'ללא תמונה'}
                      </span>
                   </div>
                </div>
             </div>
             <button 
                onClick={() => handleEdit(activity)}
                className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
             >
                ערוך הגדרות
             </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col">
             
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                <h3 className="text-xl font-bold text-slate-900">
                  {isEditing ? `עריכת פעילות: ${currentActivity.name}` : 'הגדרת סוג פעילות חדש'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
             </div>

             <div className="p-8 space-y-8">
                
                {/* שם הפעילות */}
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">שם הפעילות (כפי שיופיע לשליח)</label>
                   <input 
                      type="text" 
                      placeholder="לדוגמה: מבצע תפילין"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-lg" 
                      value={currentActivity.name}
                      onChange={(e) => setCurrentActivity({...currentActivity, name: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   
                   {/* צד ימין: מחירון */}
                   <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                      <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                         <DollarSign size={18} /> מחירון (מדרגות)
                      </h4>
                      <p className="text-xs text-green-700 mb-4">הגדר כמה כסף יקבל השליח לפי כמות המשתתפים.</p>
                      
                      <div className="space-y-3">
                         {currentActivity.pricing.map((tier, i) => (
                            <div key={i} className="flex gap-2 items-center">
                               <input 
                                 type="number" placeholder="מ-" 
                                 value={tier.min} onChange={(e) => updatePricing(i, 'min', e.target.value)}
                                 className="w-20 p-2 rounded-lg border border-green-200 text-center" 
                               />
                               <span className="text-green-700">-</span>
                               <input 
                                 type="number" placeholder="עד" 
                                 value={tier.max} onChange={(e) => updatePricing(i, 'max', e.target.value)}
                                 className="w-20 p-2 rounded-lg border border-green-200 text-center" 
                               />
                               <span className="text-green-700">=</span>
                               <div className="relative flex-1">
                                  <input 
                                    type="number" placeholder="סכום" 
                                    value={tier.price} onChange={(e) => updatePricing(i, 'price', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-green-200 font-bold" 
                                  />
                                  <span className="absolute left-3 top-2 text-green-600 text-xs">₪</span>
                               </div>
                               <button onClick={() => removePricingTier(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                            </div>
                         ))}
                         <button onClick={addPricingTier} className="text-xs font-bold text-green-700 flex items-center gap-1 hover:underline mt-2">
                            <Plus size={14} /> הוסף מדרגה
                         </button>
                      </div>
                   </div>

                   {/* צד שמאל: Form Builder */}
                   <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                         <ListPlus size={18} /> שאלות לשליח
                      </h4>
                      
                      {/* שדות מערכת קבועים */}
                      <div className="bg-white/60 p-4 rounded-xl border border-blue-100/50 mb-6 space-y-3">
                        <div className="text-xs font-bold text-slate-400 mb-1">שדות מערכת קבועים:</div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <CheckCircle2 size={16} className="text-green-500" /> <Users size={16} /> כמות משתתפים
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <CheckCircle2 size={16} className="text-green-500" /> <Calendar size={16} /> תאריך פעילות
                        </div>
                        
                        {/* הגדרת תמונה */}
                        <div className="pt-2 border-t border-blue-100 mt-2">
                           <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                              <ImageIcon size={16} className="text-blue-500"/>
                              העלאת תמונה מהשטח:
                           </label>
                           <div className="flex bg-white rounded-lg p-1 border border-blue-100">
                              <button 
                                onClick={() => setCurrentActivity({...currentActivity, imageRequirement: 'optional'})}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${currentActivity.imageRequirement === 'optional' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}
                              >
                                 רשות
                              </button>
                              <button 
                                onClick={() => setCurrentActivity({...currentActivity, imageRequirement: 'mandatory'})}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${currentActivity.imageRequirement === 'mandatory' ? 'bg-red-100 text-red-700' : 'text-slate-500'}`}
                              >
                                 חובה
                              </button>
                              <button 
                                onClick={() => setCurrentActivity({...currentActivity, imageRequirement: 'none'})}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${currentActivity.imageRequirement === 'none' ? 'bg-slate-100 text-slate-700' : 'text-slate-500'}`}
                              >
                                 ללא
                              </button>
                           </div>
                        </div>
                      </div>

                      <p className="text-xs text-blue-600 mb-2 font-bold">שאלות נוספות (מותאמות אישית):</p>
                      
                      <div className="space-y-3">
                         {currentActivity.customQuestions.map((q, i) => (
                            <div key={i} className="flex gap-2 items-start bg-white p-2 rounded-xl border border-blue-100 shadow-sm">
                               <div className="mt-2 text-slate-300 cursor-move"><GripVertical size={16} /></div>
                               <div className="flex-1 space-y-2">
                                  <input 
                                    type="text" 
                                    placeholder="השאלה (למשל: היכן התקיים?)" 
                                    value={q.question}
                                    onChange={(e) => updateQuestionText(i, e.target.value)}
                                    className="w-full p-2 border-b border-slate-100 outline-none text-sm font-bold text-slate-800 placeholder:font-normal"
                                  />
                                  <select 
                                    value={q.type}
                                    onChange={(e) => updateQuestionType(i, e.target.value)}
                                    className="w-full p-1 bg-slate-50 rounded text-xs text-slate-500 outline-none"
                                  >
                                     <option value="text">טקסט חופשי</option>
                                     <option value="number">מספר</option>
                                     <option value="yes_no">כן/לא</option>
                                     <option value="location">מיקום</option>
                                  </select>
                               </div>
                               <button onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-600 mt-2"><Trash2 size={16}/></button>
                            </div>
                         ))}
                         <button onClick={addQuestion} className="w-full py-2 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                            <Plus size={16} /> הוסף שאלה נוספת
                         </button>
                      </div>
                   </div>

                </div>
             </div>

             <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0">
                <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200">ביטול</button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
                   <Save size={20} />
                   שמור הגדרות
                </button>
             </div>

          </div>
        </div>
      )}

    </div>
  );
}