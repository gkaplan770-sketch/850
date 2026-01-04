import { createClient } from '@supabase/supabase-js';

// הכתובת והמפתח ששלחת לי
const supabaseUrl = 'https://klwncystfmipvyfazwnh.supabase.co';
const supabaseKey = 'sb_publishable_yxABAIdqzHlQQd16GNVGGQ_dWpUTXV3';

// יצירת החיבור וייצוא שלו החוצה בשם 'supabase'
export const supabase = createClient(supabaseUrl, supabaseKey);