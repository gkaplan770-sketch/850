import { redirect } from 'next/navigation';

export default function AdminPage() {
  // הפניה לדאשבורד
  redirect('/admin/dashboard');
  
  // שורה זו נדרשת כדי ש-Next.js יזהה את הפונקציה כ-Component תקין
  // (למרות שהקוד לא באמת מגיע לכאן בגלל ה-redirect)
  return null;
}