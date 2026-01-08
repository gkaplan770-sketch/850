import { createClient } from '@supabase/supabase-js';

// שליפת המשתנים מה"כספת" (קובץ .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// בדיקה שהם באמת קיימים (כדי למנוע שגיאות מוזרות אם שכחנו משהו)
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);