"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Mail, MailOpen, Clock, Trash2 } from "lucide-react";
import Link from 'next/link';

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    // שליפת הודעות: או שנשלחו ספציפית אליי, או שנשלחו לכולם (receiver_id is null)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`receiver_id.eq.${userId},receiver_id.is.null`)
      .order('created_at', { ascending: false });

    if (!error) setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (msg: any) => {
    if (msg.is_read) return;
    
    // עדכון בשרת
    await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
    
    // עדכון מקומי
    setMessages(messages.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20" dir="rtl">
       <div className="bg-white p-5 shadow-sm border-b border-slate-100 sticky top-0 z-10 flex items-center gap-3">
         <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600">
            <ArrowRight size={18} />
         </Link>
         <h1 className="text-lg font-black text-slate-800">תיבת הודעות</h1>
      </div>

      <div className="p-4 space-y-3">
         {loading ? <div className="text-center py-10 text-slate-400">טוען הודעות...</div> : messages.length === 0 ? (
            <div className="text-center py-20 opacity-60">
               <Mail size={48} className="mx-auto text-slate-300 mb-4"/>
               <p className="font-bold text-slate-500">אין הודעות חדשות</p>
            </div>
         ) : (
            messages.map((msg) => (
               <div 
                 key={msg.id} 
                 onClick={() => markAsRead(msg)}
                 className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${msg.is_read ? 'bg-white border-slate-200 opacity-80' : 'bg-blue-50 border-blue-200 shadow-sm'}`}
               >
                  {!msg.is_read && <div className="absolute top-4 left-4 w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>}
                  
                  <div className="flex items-center gap-3 mb-2">
                     <div className={`p-2 rounded-full ${msg.is_read ? 'bg-slate-100 text-slate-400' : 'bg-blue-200 text-blue-700'}`}>
                        {msg.is_read ? <MailOpen size={20}/> : <Mail size={20}/>}
                     </div>
                     <div>
                        <h3 className={`font-bold text-sm ${msg.is_read ? 'text-slate-700' : 'text-blue-900'}`}>{msg.title}</h3>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                           <Clock size={10} /> {new Date(msg.created_at).toLocaleDateString('he-IL')}
                        </div>
                     </div>
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${msg.is_read ? 'text-slate-500' : 'text-slate-800'}`}>
                     {msg.content}
                  </p>
               </div>
            ))
         )}
      </div>
    </div>
  );
}